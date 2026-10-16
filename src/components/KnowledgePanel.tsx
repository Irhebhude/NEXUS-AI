import { useState, useMemo } from 'react';
import { X, Search, Brain, MessageSquare, Eye, ShieldCheck, Lightbulb, Cpu, Wrench, BarChart3, ShieldAlert, GraduationCap } from 'lucide-react';
import type { ThemeColors } from '@/lib/theme';
import { AI_KNOWLEDGE_CATEGORIES, searchTerms, type AICategory } from '@/lib/aiKnowledge';

interface KnowledgePanelProps {
  isOpen: boolean;
  onClose: () => void;
  colors: ThemeColors;
}

const ICON_MAP: Record<string, typeof Brain> = {
  Brain,
  MessageSquare,
  ShieldCheck,
  Lightbulb,
  Cpu,
  Wrench,
  Eye,
  BarChart3,
  ShieldAlert,
  GraduationCap,
};

export function KnowledgePanel({ isOpen, onClose, colors }: KnowledgePanelProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    return searchTerms(search);
  }, [search]);

  if (!isOpen) return null;

  const displayCategories: AICategory[] = searchResults
    ? AI_KNOWLEDGE_CATEGORIES.filter((c) =>
        searchResults.some((r) => r.category === c.name)
      ).map((c) => ({
        ...c,
        terms: c.terms.filter((t) =>
          searchResults.some((r) => r.term.acronym === t.acronym)
        ),
      }))
    : activeCategory
    ? AI_KNOWLEDGE_CATEGORIES.filter((c) => c.id === activeCategory)
    : AI_KNOWLEDGE_CATEGORIES;

  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'transparent' }} onClick={onClose} />
      <div className="fixed right-0 top-0 h-dynamic-screen w-full max-w-md z-50 flex flex-col" style={{ background: colors.bg, borderLeft: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2">
            <Brain size={18} style={{ color: colors.accent }} />
            <h2 className="text-base font-semibold" style={{ color: colors.text }}>AI Knowledge Base</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded" style={{ color: colors.textSecondary }}><X size={20} /></button>
        </div>

        <div className="px-4 py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI terms..."
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
              style={{ background: colors.bgTertiary, color: colors.text, border: `1px solid ${colors.border}` }}
            />
          </div>
        </div>

        {!search && (
          <div className="flex gap-1 px-4 py-2 overflow-x-auto" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
              style={{ background: !activeCategory ? colors.bgTertiary : 'transparent', color: !activeCategory ? colors.text : colors.textMuted }}
            >
              All
            </button>
            {AI_KNOWLEDGE_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Brain;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                  style={{ background: activeCategory === cat.id ? colors.bgTertiary : 'transparent', color: activeCategory === cat.id ? colors.text : colors.textMuted }}
                >
                  <Icon size={12} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {displayCategories.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || Brain;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color: colors.accent }} />
                    <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>{cat.name}</h3>
                  </div>
                  <div className="space-y-1.5">
                    {cat.terms.map((term) => (
                      <div
                        key={term.acronym}
                        className="rounded-lg overflow-hidden"
                        style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}
                      >
                        <button
                          onClick={() => setExpandedTerm(expandedTerm === term.acronym ? null : term.acronym)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:opacity-80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: colors.accent + '20', color: colors.accent }}>
                              {term.acronym}
                            </span>
                            <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
                              {term.fullForm}
                            </span>
                          </div>
                        </button>
                        {expandedTerm === term.acronym && (
                          <div className="px-3 pb-3 pt-1">
                            <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
                              {term.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
