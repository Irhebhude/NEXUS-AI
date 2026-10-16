import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  Settings,
  CircleAlert,
  BookOpen,
  Database,
} from 'lucide-react';
import type { Conversation } from '@/lib/types';
import type { ThemeColors } from '@/lib/theme';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  colors: ThemeColors;
  providerAvailable: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onOpenSettings: () => void;
  onOpenKnowledge: () => void;
  onOpenDatabases: () => void;
}

export function Sidebar({
  conversations,
  currentId,
  isOpen,
  onClose,
  colors,
  providerAvailable,
  onNewChat,
  onSelect,
  onDelete,
  onRename,
  onOpenSettings,
  onOpenKnowledge,
  onOpenDatabases,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const startEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const commitEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.5)' }}
          className="fixed inset-0 z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:relative z-40 h-dynamic-screen transition-transform duration-200 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          width: '280px',
          background: colors.bgSecondary,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})` }}>
              <span className="text-sm font-bold" style={{ color: colors.accentText }}>N</span>
            </div>
            <div className="min-w-0">
              <span className="block font-semibold text-sm" style={{ color: colors.text }}>
                NEXUS AI
              </span>
              <span className="block text-[10px] truncate" style={{ color: colors.textMuted }}>
                Founded by Prosper Ozoya Irhebhude
              </span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1 rounded" style={{ color: colors.textSecondary }}>
            <X size={18} />
          </button>
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentText }}
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{ background: colors.bgTertiary, color: colors.text, border: `1px solid ${colors.border}` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare size={24} className="mx-auto mb-2" style={{ color: colors.textMuted }} />
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {search ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            filtered.map((conv) => (
              <div
                key={conv.id}
                className="group relative mb-0.5 rounded-lg transition-colors cursor-pointer"
                style={{ background: currentId === conv.id ? colors.bgHover : 'transparent' }}
                onClick={() => editingId === conv.id ? undefined : onSelect(conv.id)}
              >
                {editingId === conv.id ? (
                  <div className="flex items-center gap-1 px-2 py-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm rounded outline-none"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.accent}` }}
                    />
                    <button onClick={commitEdit} className="p-1 rounded" style={{ color: colors.accent }}><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1 rounded" style={{ color: colors.textMuted }}><X size={14} /></button>
                  </div>
                ) : confirmDelete === conv.id ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-xs flex-1" style={{ color: colors.textSecondary }}>Delete?</span>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); setConfirmDelete(null); }} className="p-1 rounded text-xs" style={{ color: colors.error }}><Check size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} className="p-1 rounded text-xs" style={{ color: colors.textMuted }}><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2.5 pr-16">
                      <MessageSquare size={14} style={{ color: colors.textMuted, flexShrink: 0 }} />
                      <span className="text-sm truncate flex-1" style={{ color: currentId === conv.id ? colors.text : colors.textSecondary }}>{conv.title}</span>
                    </div>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(conv); }} className="p-1.5 rounded hover:bg-black/10" style={{ color: colors.textMuted }}><Pencil size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(conv.id); }} className="p-1.5 rounded hover:bg-black/10" style={{ color: colors.textMuted }}><Trash2 size={12} /></button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-3 py-2" style={{ borderTop: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
            <div className="w-2 h-2 rounded-full" style={{ background: providerAvailable ? colors.success : colors.warning }} />
            <span>{providerAvailable ? 'AI provider connected' : 'No provider configured'}</span>
            {!providerAvailable && <CircleAlert size={12} style={{ color: colors.warning }} />}
          </div>
        </div>

        <div className="px-3 pb-3 space-y-1">
          <button onClick={onOpenKnowledge} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: colors.textSecondary }}>
            <BookOpen size={16} />
            AI Knowledge Base
          </button>
          <button onClick={onOpenDatabases} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: colors.textSecondary }}>
            <Database size={16} />
            Databases
          </button>
          <button onClick={onOpenSettings} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: colors.textSecondary }}>
            <Settings size={16} />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}
