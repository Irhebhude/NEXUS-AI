import { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Brain, AlertCircle, X, WifiOff, BookOpen } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { Sidebar } from '@/components/Sidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { Composer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { SettingsPanel } from '@/components/SettingsPanel';
import { KnowledgePanel } from '@/components/KnowledgePanel';
import { getThemeColors, type Theme } from '@/lib/theme';
import { getMemories, addMemory, deleteMemory } from '@/lib/db';
import { supabaseEnvConfigured } from '@/lib/supabase';
import type { IntelligenceMode, Memory } from '@/lib/types';

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('nexus-theme') as Theme | null;
    return saved || 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [webResearch, setWebResearch] = useState(false);
  const [intelligenceMode, setIntelligenceMode] = useState<IntelligenceMode>('auto');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [errorDismissed, setErrorDismissed] = useState(false);
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
    if (settingsOpen) {
      loadMemories();
    }
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

  const backendError = !supabaseEnvConfigured
    ? 'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    : chat.providerStatus && !chat.providerStatus.available
    ? 'No AI provider configured — set OPENROUTER_API_KEY as an edge function secret or in the system_config table.'
    : chat.error && chat.error !== 'cancelled'
    ? chat.error
    : null;
  const showError = backendError && !errorDismissed;

  return (
    <div
      className="flex h-dynamic-screen min-h-0 overflow-hidden"
      style={{ background: colors.bg, color: colors.text }}
    >
      <Sidebar
        conversations={chat.conversations}
        currentId={chat.currentConversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        colors={colors}
        providerAvailable={chat.providerStatus?.available ?? false}
        onNewChat={() => {
          chat.newConversation();
          setSidebarOpen(false);
        }}
        onSelect={(id) => {
          chat.selectConversation(id);
          setSidebarOpen(false);
          setAutoScroll(true);
        }}
        onDelete={chat.removeConversation}
        onRename={chat.renameConversation}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setSidebarOpen(false);
        }}
        onOpenKnowledge={() => {
          setKnowledgeOpen(true);
          setSidebarOpen(false);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{
            background: colors.bg,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg"
              style={{ color: colors.textSecondary }}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <Brain size={18} style={{ color: colors.accent }} />
              <span className="text-sm font-semibold" style={{ color: colors.text }}>NEXUS AI</span>
            </div>
            <span className="hidden md:block text-sm font-medium" style={{ color: colors.textSecondary }}>
              {chat.conversations.find((c) => c.id === chat.currentConversationId)?.title || 'New Conversation'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setKnowledgeOpen(true)}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
              style={{
                background: colors.bgTertiary,
                color: colors.textSecondary,
              }}
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Knowledge</span>
            </button>
            {chat.error && (
              <div className="flex items-center gap-1 text-xs" style={{ color: colors.error }}>
                <AlertCircle size={14} />
              </div>
            )}
            {chat.providerStatus && !chat.providerStatus.available && (
              <div
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                style={{
                  background: colors.warning + '15',
                  color: colors.warning,
                }}
              >
                <AlertCircle size={12} />
                <span className="hidden sm:inline">No AI provider</span>
              </div>
            )}
          </div>
        </header>

        {showError && backendError && (
          <div
            className="flex items-start gap-2.5 px-4 py-2.5 flex-shrink-0"
            style={{
              background: colors.error + '12',
              borderBottom: `1px solid ${colors.error}30`,
            }}
          >
            {!supabaseEnvConfigured ? (
              <WifiOff size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.error }} />
            ) : (
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.error }} />
            )}
            <p className="flex-1 text-xs leading-relaxed" style={{ color: colors.error }}>
              {backendError}
            </p>
            <button
              onClick={() => setErrorDismissed(true)}
              className="flex-shrink-0 p-0.5 rounded transition-opacity hover:opacity-70"
              style={{ color: colors.error }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ background: colors.bg, WebkitOverflowScrolling: 'touch' }}
        >
          {hasMessages ? (
            <div className="py-6">
              {chat.messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  colors={colors}
                  isStreaming={chat.isStreaming && i === chat.messages.length - 1 && msg.role === 'assistant'}
                  onRegenerate={chat.regenerateLastResponse}
                  isLast={i === chat.messages.length - 1}
                />
              ))}
              <div ref={scrollAnchorRef} />
            </div>
          ) : (
            <EmptyState
              colors={colors}
              onExampleClick={handleExampleClick}
            />
          )}
        </div>

        <Composer
          onSend={(content, research) => chat.sendMessage(content, research, intelligenceMode)}
          onStop={chat.stopGeneration}
          isStreaming={chat.isStreaming}
          model={chat.model}
          onModelChange={chat.setModel}
          colors={colors}
          webResearch={webResearch}
          onToggleWebResearch={() => setWebResearch(!webResearch)}
          intelligenceMode={intelligenceMode}
          onIntelligenceModeChange={setIntelligenceMode}
        />
      </div>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        colors={colors}
        providerStatus={chat.providerStatus}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
      />

      <KnowledgePanel
        isOpen={knowledgeOpen}
        onClose={() => setKnowledgeOpen(false)}
        colors={colors}
      />
    </div>
  );
}

export default App;
