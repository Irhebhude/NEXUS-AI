import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyRequest, verifyResponse } from '../lib/aiKnowledge';
import { createConversation, getConversations, getMessages, saveMessage, updateMessageContent, deleteConversation, renameConversation, recordUsage } from '../lib/db';
import { getCurrentModel, setCurrentModel, getProviderStatus, streamChatCompletion } from '../lib/ai';
import type { Conversation, Message, MessageMetadata, ProviderStatus } from '../lib/types';

const SYSTEM_PROMPT = 'You are NEXUS AI, a capable and concise assistant. Give accurate, useful answers. When you are uncertain, say so. Do not claim to have performed actions you cannot perform.';
const MODE_INSTRUCTIONS = { balanced: 'Answer naturally with a balance of speed and depth.', reasoning: 'Think carefully through complex problems and show your reasoning clearly.', fast: 'Be concise and direct.' } as const;

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(getCurrentModel());
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const sendLockRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const checkStatus = useCallback(async () => {
    const status = await getProviderStatus();
    setProviderStatus(status);
  }, []);
  useEffect(() => { getConversations().then(setConversations); checkStatus(); }, [checkStatus]);
  useEffect(() => { setCurrentModel(model); }, [model]);
  const newConversation = useCallback(async () => { const conversation = await createConversation(); setConversations((prev) => [conversation, ...prev]); setCurrentConversationId(conversation.id); setMessages([]); setError(null); }, []);
  const selectConversation = useCallback(async (id: string) => { setCurrentConversationId(id); setMessages(await getMessages(id)); setError(null); }, []);
  const removeConversation = useCallback(async (id: string) => { await deleteConversation(id); setConversations((prev) => prev.filter((c) => c.id !== id)); if (currentConversationId === id) { setCurrentConversationId(null); setMessages([]); } }, [currentConversationId]);
  const renameConversationCb = useCallback(async (id: string, title: string) => { await renameConversation(id, title); setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title } : c)); }, []);
  const sendMessage = useCallback(async (content: string, webResearch = false, intelligenceMode: keyof typeof MODE_INSTRUCTIONS = 'balanced') => {
    if (!content.trim() || isLoading || sendLockRef.current) return;
    sendLockRef.current = true; setError(null); setIsLoading(true); setIsStreaming(true);
    let conversationId = currentConversationId;
    if (!conversationId) { const conversation = await createConversation(content.slice(0, 48)); conversationId = conversation.id; setCurrentConversationId(conversationId); setConversations((prev) => [conversation, ...prev]); }
    const userMessage: Message = { id: crypto.randomUUID(), conversation_id: conversationId, role: 'user', content, created_at: new Date().toISOString() };
    await saveMessage(userMessage); setMessages((prev) => [...prev, userMessage]);
    const history = [...messages, userMessage].map((message) => ({ role: message.role, content: message.content }));
    const assistantMsg: Message = { id: crypto.randomUUID(), conversation_id: conversationId, role: 'assistant', content: '', created_at: new Date().toISOString() };
    await saveMessage(assistantMsg); setMessages((prev) => [...prev, assistantMsg]);
    const classification = classifyRequest(content); const shouldResearch = webResearch || classification.needsWebSearch; let accumulatedContent = '';
    const abortController = new AbortController(); abortRef.current = abortController;
    await streamChatCompletion({ messages: history, model, stream: true, system_prompt: `${SYSTEM_PROMPT}\n\nMode: ${MODE_INSTRUCTIONS[intelligenceMode]}`, temperature: intelligenceMode === 'reasoning' ? 0.2 : 0.7, web_research: shouldResearch, intelligence_mode: intelligenceMode }, { onToken: (token) => { accumulatedContent += token; setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: accumulatedContent } : m)); }, onDone: async (response) => { setIsStreaming(false); setIsLoading(false); sendLockRef.current = false; const verification = verifyResponse(accumulatedContent, content); const metadata: MessageMetadata = { intelligence_mode: intelligenceMode, model: response.model, provider: response.provider, tokens_in: response.tokens_in, tokens_out: response.tokens_out, latency_ms: response.latency_ms, verification: { status: verification.status, summary: verification.summary, claims: [], checks_performed: verification.checks } }; await updateMessageContent(assistantMsg.id, accumulatedContent, metadata); if (response.tokens_out > 0) recordUsage({ provider: response.provider, model: response.model, tokens_in: response.tokens_in, tokens_out: response.tokens_out, cost_estimate: 0, latency_ms: response.latency_ms }); setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: accumulatedContent, metadata } : m)); }, onError: async (err) => { setIsStreaming(false); setIsLoading(false); sendLockRef.current = false; if (err === 'cancelled') { const metadata: MessageMetadata = { cancelled: true }; await updateMessageContent(assistantMsg.id, accumulatedContent || '*Response cancelled*', metadata); setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: accumulatedContent || '*Response cancelled*', metadata } : m)); } else { setError(err); const metadata: MessageMetadata = { error: err }; await updateMessageContent(assistantMsg.id, `*Error: ${err}*`, metadata); setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: `*Error: ${err}*`, metadata } : m)); } } }, abortController.signal);
  }, [currentConversationId, isLoading, messages, model]);
  const stopGeneration = useCallback(() => { abortRef.current?.abort(); }, []);
  const regenerateLastResponse = useCallback(async () => { if (messages.length < 2 || isStreaming) return; const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user'); if (!lastUserMsg) return; const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant'); if (lastAssistant) await deleteConversation(lastAssistant.id); setMessages((prev) => prev.filter((m) => m.id !== lastAssistant?.id)); await sendMessage(lastUserMsg.content); }, [messages, isStreaming, sendMessage]);
  return { conversations, currentConversationId, messages, isLoading, isStreaming, error, model, providerStatus, setModel, newConversation, selectConversation, removeConversation, renameConversation: renameConversationCb, sendMessage, stopGeneration, regenerateLastResponse, refreshStatus: checkStatus };
}
