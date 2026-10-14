import { Search, FileText, Code, Calculator } from 'lucide-react';
import type { ThemeColors } from '@/lib/theme';

interface EmptyStateProps {
  colors: ThemeColors;
  onExampleClick: (prompt: string) => void;
}

const EXAMPLES = [
  { icon: Search, title: 'Research a topic', prompt: 'What are the latest developments in quantum computing?' },
  { icon: Code, title: 'Write code', prompt: 'Write a TypeScript function that implements binary search on a sorted array.' },
  { icon: Calculator, title: 'Solve a problem', prompt: 'Calculate the compound interest on $10,000 at 5% annual rate for 10 years.' },
  { icon: FileText, title: 'Analyze and compare', prompt: 'Compare the advantages and disadvantages of solar vs wind energy.' },
];

export function EmptyState({ colors, onExampleClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-8 safe-top">
      <div className="mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})` }}>
          <img src="/1791960291251_1%20copy.jpg" alt="NEXUS AI logo" className="h-full w-full rounded-2xl object-cover" />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: colors.text }}>NEXUS AI</h1>
      <p className="text-base text-center mb-1" style={{ color: colors.textSecondary }}>Ask anything. Examine the evidence. Understand the answer.</p>
      <p className="text-xs text-center" style={{ color: colors.textMuted }}>Owned and founded by Prosper Ozoya Irhebhude</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
        {EXAMPLES.map((example, i) => (
          <button key={i} onClick={() => onExampleClick(example.prompt)} className="flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}>
            <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: colors.bgTertiary, color: colors.accent }}><example.icon size={18} /></div>
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: colors.text }}>{example.title}</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>{example.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
