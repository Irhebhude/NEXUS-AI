import { useState } from 'react';
import { X, Brain, Sun, Moon, Database, Cpu, Shield, BookOpen, Trash2, Plus } from 'lucide-react';
import type { Theme } from '@/lib/theme';
import type { ThemeColors } from '@/lib/theme';
import type { Memory } from '@/lib/types';
import { PROVIDER_REGISTRY } from '@/lib/providers';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  colors: ThemeColors;
  providerStatus: { providers: Record<string, boolean>; available: boolean } | null;
  memories: Memory[];
  onAddMemory: (key: string, content: string, category: string) => void;
  onDeleteMemory: (id: string) => void;
}

type Tab = 'general' | 'providers' | 'memory' | 'about';

export function SettingsPanel({ isOpen, onClose, theme, onThemeChange, colors, providerStatus, memories, onAddMemory, onDeleteMemory }: SettingsPanelProps) {
  const [tab, setTab] = useState<Tab>('general');
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('general');

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: typeof Cpu }[] = [
    { id: 'general', label: 'General', icon: Cpu },
    { id: 'providers', label: 'AI Providers', icon: Database },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'about', label: 'About', icon: BookOpen },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'transparent' }} onClick={onClose} />
      <div className="fixed right-0 top-0 h-dynamic-screen w-full max-w-md z-50 flex flex-col" style={{ background: colors.bg, borderLeft: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <h2 className="text-base font-semibold" style={{ color: colors.text }}>Settings</h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: colors.textSecondary }}><X size={20} /></button>
        </div>
        <div className="flex gap-1 px-4 py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: tab === t.id ? colors.bgTertiary : 'transparent', color: tab === t.id ? colors.text : colors.textMuted }}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'general' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Appearance</h3>
                <div className="flex gap-2">
                  <button onClick={() => onThemeChange('light')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors" style={{ background: theme === 'light' ? colors.accent : colors.bgTertiary, color: theme === 'light' ? colors.accentText : colors.textSecondary, border: `1px solid ${theme === 'light' ? colors.accent : colors.border}` }}><Sun size={16} />Light</button>
                  <button onClick={() => onThemeChange('dark')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors" style={{ background: theme === 'dark' ? colors.accent : colors.bgTertiary, color: theme === 'dark' ? colors.accentText : colors.textSecondary, border: `1px solid ${theme === 'dark' ? colors.accent : colors.border}` }}><Moon size={16} />Dark</button>
                </div>
              </div>
              <div className="pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Security</h3>
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: colors.bgSecondary }}><Shield size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.success }} /><div><p className="text-xs font-medium" style={{ color: colors.text }}>API keys are server-side only</p><p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>All AI provider credentials are stored as edge function secrets and never exposed to the browser.</p></div></div>
              </div>
            </div>
          )}
          {tab === 'providers' && (
            <div className="space-y-3">
              <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>NEXUS AI uses OpenRouter for every model. Keep the OpenRouter key server-side; it is never exposed to the browser.</p>
              {PROVIDER_REGISTRY.map((provider) => {
                const isConfigured = providerStatus?.providers[provider.id] || false;
                return <div key={provider.id} className="p-3 rounded-lg" style={{ background: colors.bgSecondary, border: `1px solid ${isConfigured ? colors.success + '40' : colors.border}` }}><div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold" style={{ color: colors.text }}>{provider.name}</span><div className="flex items-center gap-1.5 text-xs" style={{ color: isConfigured ? colors.success : colors.textMuted }}><div className="w-2 h-2 rounded-full" style={{ background: isConfigured ? colors.success : colors.textMuted }} />{isConfigured ? 'Connected' : 'Not configured'}</div></div><div className="text-xs space-y-1" style={{ color: colors.textMuted }}><p>Models: {provider.models.map((model) => model.label).join(', ')}</p><p>Capabilities: {[provider.capabilities.streaming && 'Streaming', provider.capabilities.toolUse && 'Tool Use', provider.capabilities.imageInput && 'Image Input', provider.capabilities.structuredOutput && 'Structured Output'].filter(Boolean).join(', ')}</p></div></div>;
              })}
            </div>
          )}
          {tab === 'memory' && (
            <div className="space-y-4">
              <div><h3 className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Add Memory</h3><div className="space-y-2"><input type="text" value={newMemoryKey} onChange={(e) => setNewMemoryKey(e.target.value)} placeholder="Memory key (e.g., 'preferred_language')" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} /><textarea value={newMemoryContent} onChange={(e) => setNewMemoryContent(e.target.value)} placeholder="Memory content..." rows={2} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} /><div className="flex gap-2"><input type="text" value={newMemoryCategory} onChange={(e) => setNewMemoryCategory(e.target.value)} placeholder="category" className="flex-1 px-3 py-2 text-sm rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} /><button onClick={() => { if (newMemoryKey.trim() && newMemoryContent.trim()) { onAddMemory(newMemoryKey.trim(), newMemoryContent.trim(), newMemoryCategory.trim() || 'general'); setNewMemoryKey(''); setNewMemoryContent(''); setNewMemoryCategory('general'); } }} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: colors.accent, color: colors.accentText }}><Plus size={14} />Save</button></div></div></div>
              <div style={{ borderTop: `1px solid ${colors.border}` }} className="pt-4"><h3 className="text-sm font-semibold mb-2" style={{ color: colors.text }}>Saved Memories ({memories.length})</h3>{memories.length === 0 ? <p className="text-xs text-center py-6" style={{ color: colors.textMuted }}>No memories saved yet. Memories persist across conversations.</p> : <div className="space-y-2">{memories.map((mem) => <div key={mem.id} className="flex items-start justify-between gap-2 p-2.5 rounded-lg group" style={{ background: colors.bgSecondary }}><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5"><span className="text-xs font-semibold" style={{ color: colors.text }}>{mem.key}</span><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: colors.bgTertiary, color: colors.textMuted }}>{mem.category}</span></div><p className="text-xs" style={{ color: colors.textSecondary }}>{mem.content}</p></div><button onClick={() => onDeleteMemory(mem.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.error }}><Trash2 size={14} /></button></div>)}</div>}</div>
            </div>
          )}
          {tab === 'about' && (
            <div className="space-y-4 text-sm" style={{ color: colors.textSecondary }}>
              <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})` }}><img src="/1791960291251_1%20copy.jpg" alt="NEXUS AI logo" className="h-full w-full rounded-xl object-cover" /></div><div><h3 className="text-base font-bold" style={{ color: colors.text }}>NEXUS AI</h3><p className="text-xs" style={{ color: colors.textMuted }}>Universal AI Intelligence Platform</p><p className="text-xs mt-1" style={{ color: colors.accent }}>Owned and founded by Prosper Ozoya Irhebhude</p></div></div>
              <div><h4 className="text-xs font-semibold mb-1.5 uppercase" style={{ color: colors.textMuted }}>Implemented Systems</h4><ul className="space-y-1 text-xs"><li style={{ color: colors.success }}>Foundation Model Adapter — OpenRouter streaming across supported models</li><li style={{ color: colors.success }}>Request Classification & Routing — auto-detects question type and selects approach</li><li style={{ color: colors.success }}>Web Research Pipeline — DuckDuckGo search with page content extraction and real citations</li><li style={{ color: colors.success }}>Verification Engine — deterministic checks for math, citations, financial guardrails, and claim validation</li><li style={{ color: colors.success }}>Persistent Memory — user-saved facts injected into conversations</li><li style={{ color: colors.success }}>Multimodal Input — image attachments for vision-capable models</li><li style={{ color: colors.success }}>Bounded Tool Execution — calculator, word count, character count</li><li style={{ color: colors.success }}>Server-side credential management — API keys never exposed to browser</li></ul></div>
              <div><h4 className="text-xs font-semibold mb-1.5 uppercase" style={{ color: colors.textMuted }}>AI Technology Categories</h4><ul className="space-y-1 text-xs"><li style={{ color: colors.success }}><strong>FM:</strong> Active — uses third-party models via provider APIs.</li><li style={{ color: colors.success }}><strong>ML:</strong> Active — deterministic classification and verification algorithms.</li><li style={{ color: colors.success }}><strong>LMM:</strong> Active — image input with vision-capable models.</li><li style={{ color: colors.success }}><strong>LAM:</strong> Active — bounded tool execution.</li><li style={{ color: colors.success }}><strong>RLM:</strong> Active — reasoning mode with validation.</li><li style={{ color: colors.success }}><strong>AIS:</strong> Active — central orchestration.</li><li style={{ color: colors.warning }}><strong>DL:</strong> Partial — provided by underlying models, not run as standalone NEXUS inference.</li><li style={{ color: colors.warning }}><strong>VLA:</strong> Unavailable — no VLA model API is integrated.</li></ul></div>
              <div><h4 className="text-xs font-semibold mb-1.5 uppercase" style={{ color: colors.textMuted }}>Architecture</h4><p className="text-xs">Frontend: React + TypeScript + Tailwind CSS, built with Vite. Backend: Supabase (PostgreSQL, Edge Functions, Realtime). AI: OpenRouter proxy for supported models.</p></div>
              <div><h4 className="text-xs font-semibold mb-1.5 uppercase" style={{ color: colors.textMuted }}>Known Limitations</h4><ul className="space-y-1 text-xs"><li>Web research uses DuckDuckGo and may be rate-limited</li><li>VLA models are not integrated</li><li>NEXUS AI has not trained its own foundation model</li><li>AGI and ASI are not achieved</li><li>Tool execution is bounded with no shell or arbitrary filesystem access</li></ul></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
