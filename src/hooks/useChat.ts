import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  createConversation,
  getConversations,
  getMessages,
  addMessage,
  updateMessageContent,
  deleteMessage,
  deleteConversation,
  updateConversationTitle,
  recordUsage,
} from '@/lib/db';
import { streamChatCompletion, checkProviderStatus, classifyQuestion, verifyResponse } from '@/lib/ai';
import type { Conversation, ChatMessage, MessageMetadata } from '@/lib/types';

const SYSTEM_PROMPT = `You are NEXUS AI, an advanced intelligence platform that provides accurate, evidence-based answers.

Your capabilities include:
- Answering questions with transparent reasoning
- Providing evidence-linked answers when citing information
- Acknowledging uncertainty rather than fabricating facts
- Writing and explaining code
- Performing calculations
- Analyzing and comparing options

Guidelines:
- Be concise but thorough
- Use markdown formatting for readability
- Include source links when referencing specific facts
- If you are unsure, say so explicitly
- Never fabricate citations, data, or capabilities
- For mathematical questions, show your work`;

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState('openrouter/free');
  const [providerStatus, setProviderStatus] = useState<{ providers: Record<string, boolean>; available: boolean } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sendLockRef = useRef(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    checkStatus();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Realtime subscription for conversations
  useEffect(() => {
    const channel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkStatus = async () => {
    const status = await checkProviderStatus();
    setProviderStatus(status);
  };

  const loadConversations = async () => {
    const convs = await getConversations();
    setConversations(convs);
  };

  const loadMessages = async (conversationId: string) => {
    const msgs = await getMessages(conversationId);
    setMessages(msgs);
  };

  const newConversation = useCallback(async () => {
    const conv = await createConversation('New Conversation', model);
    if (conv) {
      setCurrentConversationId(conv.id);
      setMessages([]);
      setError(null);
    }
    return conv;
  }, [model]);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setError(null);
  }, []);

  const removeConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
    await loadConversations();
  }, [currentConversationId]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    await updateConversationTitle(id, title);
    await loadConversations();
  }, []);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (content: string, webResearch = false) => {
    if (!content.trim() || isStreaming || sendLockRef.current) return;
    sendLockRef.current = true;

    setError(null);

    // Get or create conversation
    let convId = currentConversationId;
    if (!convId) {
      const conv = await createConversation(
        content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        model
      );
      if (!conv) {
        setError('Failed to create conversation');
        sendLockRef.current = false;
        return;
      }
      convId = conv.id;
      setConversations((prev) => [conv, ...prev]);
    }

    // Add user message
    const userMsg = await addMessage(convId, 'user', content);
    if (userMsg) {
      setMessages((prev) => [...prev, userMsg]);
    }

    // Auto-title if first message
    if (messages.length === 0) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      updateConversationTitle(convId, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title } : c))
      );
    }

    // Create placeholder assistant message
    const assistantMsg = await addMessage(convId, 'assistant', '');
    if (!assistantMsg) {
      setError('Failed to create response placeholder');
      sendLockRef.current = false;
      return;
    }
    setMessages((prev) => [...prev, assistantMsg]);
    setCurrentConversationId(convId);

    // Classify the question for reasoning trace
    const classification = classifyQuestion(content);

    setIsStreaming(true);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Build message history for the AI
    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }))
      .concat([{ role: 'user' as const, content }]);

    let accumulatedContent = '';

    await streamChatCompletion(
      {
        messages: history,
        model,
        stream: true,
        system_prompt: SYSTEM_PROMPT,
        temperature: classification.type === 'code' ? 0.2 : 0.7,
        web_research: webResearch || classification.needsSearch,
      },
      {
        onToken: (token) => {
          accumulatedContent += token;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: accumulatedContent } : m
            )
          );
        },
        onDone: async (response) => {
          setIsStreaming(false);
          setIsLoading(false);
          sendLockRef.current = false;

          // Run verification
          const verification = verifyResponse(accumulatedContent, content);

          const metadata: MessageMetadata = {
            model: response.model,
            provider: response.provider,
            tokens_in: response.tokens_in,
            tokens_out: response.tokens_out,
            latency_ms: response.latency_ms,
            verification: {
              status: verification.status,
              summary: verification.summary,
              claims: [],
              checks_performed: verification.checks,
            },
          };

          await updateMessageContent(assistantMsg.id, accumulatedContent, metadata);

          // Record usage
          if (response.tokens_out > 0) {
            recordUsage({
              provider: response.provider,
              model: response.model,
              tokens_in: response.tokens_in,
              tokens_out: response.tokens_out,
              cost_estimate: 0,
              latency_ms: response.latency_ms,
            });
          }

          // Update message in state
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: accumulatedContent, metadata } : m
            )
          );
        },
        onError: async (err) => {
          setIsStreaming(false);
          setIsLoading(false);
          sendLockRef.current = false;

          if (err === 'cancelled') {
            const metadata: MessageMetadata = { cancelled: true };
            await updateMessageContent(assistantMsg.id, accumulatedContent || '*Response cancelled*', metadata);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: accumulatedContent || '*Response cancelled*', metadata }
                  : m
              )
            );
          } else {
            setError(err);
            const metadata: MessageMetadata = { error: err };
            await updateMessageContent(assistantMsg.id, `*Error: ${err}*`, metadata);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: `*Error: ${err}*`, metadata } : m
              )
            );
          }
        },
      },
      abortController.signal
    );
  }, [currentConversationId, isStreaming, messages, model]);

  const regenerateLastResponse = useCallback(async () => {
    if (messages.length < 2 || isStreaming) return;

    // Find last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove last assistant message
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant) {
      await deleteMessage(lastAssistant.id);
    }

    // Re-send
    setMessages((prev) => prev.filter((m) => m.id !== lastAssistant?.id));
    await sendMessage(lastUserMsg.content);
  }, [messages, isStreaming, sendMessage]);

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    isStreaming,
    error,
    model,
    providerStatus,
    setModel,
    newConversation,
    selectConversation,
    removeConversation,
    renameConversation,
    sendMessage,
    stopGeneration,
    regenerateLastResponse,
    refreshStatus: checkStatus,
  };
}
