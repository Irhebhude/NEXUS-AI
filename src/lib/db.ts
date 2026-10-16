import { supabase } from './supabase';
import type { Conversation, ChatMessage, Memory, UsageMetric } from './types';

export async function createConversation(title = 'New Conversation', model = 'default'): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title, model })
    .select()
    .single();
  if (error) {
    console.error('Failed to create conversation:', error);
    return null;
  }
  return data as Conversation;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }
  return (data as Conversation[]) || [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('Failed to fetch conversation:', error);
    return null;
  }
  return data as Conversation | null;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('Failed to update conversation title:', error);
}

export async function touchConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('Failed to touch conversation:', error);
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);
  if (error) console.error('Failed to delete conversation:', error);
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }
  return (data as ChatMessage[]) || [];
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content, metadata })
    .select()
    .single();
  if (error) {
    console.error('Failed to add message:', error);
    return null;
  }
  await touchConversation(conversationId);
  return data as ChatMessage;
}

export async function updateMessageContent(id: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
  const update: Record<string, unknown> = { content };
  if (metadata) update.metadata = metadata;
  const { error } = await supabase
    .from('messages')
    .update(update)
    .eq('id', id);
  if (error) console.error('Failed to update message:', error);
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);
  if (error) console.error('Failed to delete message:', error);
}

export async function getMemories(category?: string): Promise<Memory[]> {
  let query = supabase.from('memories').select('*').order('updated_at', { ascending: false });
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch memories:', error);
    return [];
  }
  return (data as Memory[]) || [];
}

export async function addMemory(key: string, content: string, category = 'general'): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .insert({ key, content, category })
    .select()
    .single();
  if (error) {
    console.error('Failed to add memory:', error);
    return null;
  }
  return data as Memory;
}

export async function updateMemory(id: string, key: string, content: string, category: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .update({ key, content, category, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('Failed to update memory:', error);
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id);
  if (error) console.error('Failed to delete memory:', error);
}

export async function recordUsage(metric: Omit<UsageMetric, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('usage_metrics')
    .insert(metric);
  if (error) console.error('Failed to record usage:', error);
}

export async function getUsageStats(): Promise<UsageMetric[]> {
  const { data, error } = await supabase
    .from('usage_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('Failed to fetch usage stats:', error);
    return [];
  }
  return (data as UsageMetric[]) || [];
}
