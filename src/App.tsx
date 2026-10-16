import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Database, Menu, X, WifiOff, Brain } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { Composer } from './components/Composer';
import { MessageBubble } from './components/MessageBubble';
import { SettingsPanel } from './components/SettingsPanel';
import { KnowledgePanel } from './components/KnowledgePanel';
import { DatabasePanel } from './components/DatabasePanel';
import { useChat } from './hooks/useChat';
import { useTheme } from './lib/theme';
import { getMemories, saveMemory, deleteMemory } from './lib/db';
import { supabaseEnvConfigured } from './lib/supabase';
import type { ColorScheme, Memory } from './lib/types';

function App() {
  const { theme, colors, setTheme } = useTheme();
  const chat = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [webResearch, setWebResearch] = useState(false);
  const [intelligenceMode, setIntelligenceMode] = useState<'balanced' | 'reasoning' | 'fast'>('balanced');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMemories().then(setMemories);
  }, []);

  useEffect(() => {
    if (autoScroll) scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, autoScroll]);

  useEffect(() => {
    setErrorDismissed(false);
  }, [chat.error, chat.providerStatus]);

  const handleAddMemory = useCallback(async (key: string, content: string, category: string) => {
    const memory = await saveMemory(key, content, category);
    setMemories((prev) => [...prev, memory]);
  }, []);

  const handleDeleteMemory = useCallback(async (id: string) => {
    await deleteMemory(id);
    setMemories((prev) => prev.filter((memory) => memory.id !== id));
  }, []);

  const handleExampleClick = (prompt: string) => {
    chat.sendMessage(prompt);
    setAutoScroll(true);
  };

  const hasMessages = chat.messages.length > 0;

  const aiAvailable = chat.providerStatus?.available ?? false;
  const providerCredentialError = chat.error?.toLowerCase().includes('openrouter') || chat.error?.toLowerCase().includes('authentication failed');
  const backendError = !supabaseEnvConfigured
    ? 'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    : (chat.providerStatus && !aiAvailable) || providerCredentialError
    ? 'Please add your OpenRouter API Key in Secrets settings to enable AI features.'
    : chat.error && chat.error !== 'cancelled'
    ? chat.error
    : null;
  const showError = backendError && !errorDismissed;

  return (
    <div className="flex h-dynamic-screen min-h-0 overflow-hidden" style={{ background: colors.bg, color: colors.text }}>
      <Sidebar conversations={chat.conversations} currentId={chat.currentConversationId} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} colors={colors} providerAvailable={aiAvailable} onNewChat={() => { chat.newConversation(); setSidebarOpen(false); }} onSelect={(id) => { chat.selectConversation(id); setSidebarOpen(false); setAutoScroll(true); }} onDelete={chat.removeConversation} onRename={chat.renameConversation} onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false); }} onOpenKnowledge={() => { setKnowledgeOpen(true); setSidebarOpen(false); }} onOpenDatabases={() => { setDatabaseOpen(true); setSidebarOpen(false); }} />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg" style={{ color: colors.textSecondary }}><Menu size={20} /></button><div className="flex items-center gap-2 md:hidden"><Brain size={18} style={{ color: colors.accent }} /><span className="text-sm font-semibold" style={{ color: colors.text }}>NEXUS AI</span></div><span className="hidden md:block text-sm font-medium" style={{ color: colors.textSecondary }}>{chat.conversations.find((c) => c.id === chat.currentConversationId)?.title || 'New Conversation'}</span></div>
          <div className="flex items-center gap-2"><button onClick={() => setKnowledgeOpen(true)} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80" style={{ background: colors.bgTertiary, color: colors.textSecondary }}><BookOpen size={14} /><span className="hidden sm:inline">Knowledge</span></button><button onClick={() => setDatabaseOpen(true)} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80" style={{ background: colors.bgTertiary, color: colors.textSecondary }}><Database size={14} /><span className="hidden sm:inline">Databases</span></button>{chat.error && <div className="flex items-center gap-1 text-xs" style={{ color: colors.error }}><AlertCircle size={14} /></div>}{chat.providerStatus && !chat.providerStatus.available && <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg" style={{ background: colors.warning + '15', color: colors.warning }}><AlertCircle size={12} /><span className="hidden sm:inline">No AI provider</span></div>}</div>
        </header>
        {showError && backendError && <div className="flex items-start gap-2.5 px-4 py-2.5 flex-shrink-0" style={{ background: colors.error + '12', borderBottom: `1px solid ${colors.error}30` }}>{!supabaseEnvConfigured ? <WifiOff size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.error }} /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.error }} />}<p className="flex-1 text-xs leading-relaxed" style={{ color: colors.error }}>{backendError}</p><button onClick={() => setErrorDismissed(true)} className="flex-shrink-0 p-0.5 rounded transition-opacity hover:opacity-70" style={{ color: colors.error }}><X size={14} /></button></div>}
        <div ref={messagesContainerRef} onScroll={() => setAutoScroll(false)} className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ background: colors.bg, WebkitOverflowScrolling: 'touch' }}>{hasMessages ? <div className="py-6">{chat.messages.map((msg, i) => <MessageBubble key={msg.id} message={msg} colors={colors} isStreaming={chat.isStreaming && i === chat.messages.length - 1 && msg.role === 'assistant'} onRegenerate={chat.regenerateLastResponse} isLast={i === chat.messages.length - 1} />)}<div ref={scrollAnchorRef} /></div> : <EmptyState colors={colors} onExampleClick={handleExampleClick} />}</div>
        <Composer onSend={(content, research) => chat.sendMessage(content, research, intelligenceMode)} onStop={chat.stopGeneration} isStreaming={chat.isStreaming} model={chat.model} onModelChange={chat.setModel} colors={colors} webResearch={webResearch} onToggleWebResearch={() => setWebResearch(!webResearch)} intelligenceMode={intelligenceMode} onIntelligenceModeChange={setIntelligenceMode} aiAvailable={aiAvailable} />
      </div>
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} onThemeChange={setTheme} colors={colors} providerStatus={chat.providerStatus} memories={memories} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} />
      <KnowledgePanel isOpen={knowledgeOpen} onClose={() => setKnowledgeOpen(false)} colors={colors} />
      <DatabasePanel isOpen={databaseOpen} onClose={() => setDatabaseOpen(false)} colors={colors} />
    </div>
  );
}

export default App;
