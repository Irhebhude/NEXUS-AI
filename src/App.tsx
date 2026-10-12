import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Brain, AlertCircle } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { Sidebar } from '@/components/Sidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { Composer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { SettingsPanel } from '@/components/SettingsPanel';
import { getThemeColors, type Theme } from '@/lib/theme';
import { getMemories, addMemory, deleteMemory } from '@/lib/db';
import type { Memory } from '@/lib/types';

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('nexus-theme') as Theme | null;
    return saved || 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [webResearch, setWebResearch] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const colors = getThemeColors(theme);
  const chat = useChat();

  useEffect(() => {
    localStorage.setItem('nexus-theme', theme);
    const root = document.documentElement;
    root.style.setProperty('--bg', colors.bg);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-tertiary', colors.bgTertiary);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--text', colors.text);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-hover', colors.accentHover);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--error', colors.error);
  }, [theme, colors]);

  useEffect(() => {
    if (settingsOpen) loadMemories();
  }, [settingsOpen]);

  const loadMemories = async () => {
    const mems = await getMemories();
    setMemories(mems);
  };

  const handleAddMemory = async (key: string, content: string, category: string) => {
    await addMemory(key, content, category);
    await loadMemories();
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteMemory(id);
    await loadMemories();
  };

  useEffect(() => {
    if (autoScroll && scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chat.messages, autoScroll]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setAutoScroll(nearBottom);
  }, []);

  const handleExampleClick = (prompt: string) => {
    chat.sendMessage(prompt);
    setAutoScroll(true);
  };

  const hasMessages = chat.messages.length > 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.bg, color: colors.text }}>
      <Sidebar
        conversations={chat.conversations}
        currentId={chat.currentConversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        colors={colors}
        providerAvailable={chat.providerStatus?.available ?? false}
        onNewChat={() => { chat.newConversation(); setSidebarOpen(false); }}
        onSelect={(id) => { chat.selectConversation(id); setSidebarOpen(false); setAutoScroll(true); }}
        onDelete={chat.removeConversation}
        onRename={chat.renameConversation}
        onOpenSettings={() => { setSettingsOpen(true); setSidebarOpen(false); }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 rounded-lg" style={{ color: colors.textSecondary }}><Menu size={20} /></button>
            <div className="flex items-center gap-2 md:hidden"><Brain size={18} style={{ color: colors.accent }} /><span className="text-sm font-semibold" style={{ color: colors.text }}>NEXUS AI</span></div>
            <span className="hidden md:block text-sm font-medium" style={{ color: colors.textSecondary }}>{chat.conversations.find((c) => c.id === chat.currentConversationId)?.title || 'New Conversation'}</span>
          </div>
          <div className="flex items-center gap-2">
            {chat.error && <div className="flex items-center gap-1 text-xs" style={{ color: colors.error }}><AlertCircle size={14} /></div>}
            {chat.providerStatus && !chat.providerStatus.available && <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg" style={{ background: colors.warning + '15', color: colors.warning }}><AlertCircle size={12} /><span className="hidden sm:inline">No AI provider</span></div>}
          </div>
        </header>
        <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto" style={{ background: colors.bg }}>
          {hasMessages ? <div className="py-6">{chat.messages.map((msg, i) => <MessageBubble key={msg.id} message={msg} colors={colors} isStreaming={chat.isStreaming && i === chat.messages.length - 1 && msg.role === 'assistant'} onRegenerate={chat.regenerateLastResponse} isLast={i === chat.messages.length - 1} />)}<div ref={scrollAnchorRef} /></div> : <EmptyState colors={colors} onExampleClick={handleExampleClick} providerAvailable={chat.providerStatus?.available ?? false} />}
        </div>
        <Composer onSend={chat.sendMessage} onStop={chat.stopGeneration} isStreaming={chat.isStreaming} disabled={false} model={chat.model} onModelChange={chat.setModel} colors={colors} webResearch={webResearch} onToggleWebResearch={() => setWebResearch(!webResearch)} />
      </div>
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} onThemeChange={setTheme} colors={colors} providerStatus={chat.providerStatus} memories={memories} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} />
    </div>
  );
}

export default App;
