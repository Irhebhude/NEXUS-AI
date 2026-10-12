import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, Globe, ChevronDown } from 'lucide-react';
import { getAllModels } from '@/lib/providers';
import type { ThemeColors } from '@/lib/theme';

interface ComposerProps {
  onSend: (content: string, webResearch?: boolean) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  model: string;
  onModelChange: (model: string) => void;
  colors: ThemeColors;
  webResearch: boolean;
  onToggleWebResearch: () => void;
}

export function Composer({
  onSend,
  onStop,
  isStreaming,
  disabled,
  model,
  onModelChange,
  colors,
  webResearch,
  onToggleWebResearch,
}: ComposerProps) {
  const [input, setInput] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const models = getAllModels();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim(), webResearch);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 safe-bottom" style={{ background: colors.bg }}>
      <div className="max-w-3xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Model selector */}
          <div className="relative" ref={modelMenuRef}>
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: colors.bgTertiary,
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
              }}
            >
              {model}
              <ChevronDown size={12} />
            </button>
            {showModelMenu && (
              <div
                className="absolute bottom-full mb-1 left-0 w-56 sm:w-64 rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="py-1">
                  {models.map((m) => (
                    <button
                      key={`${m.providerId}-${m.model}`}
                      onClick={() => {
                        onModelChange(m.model);
                        setShowModelMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-black/5 transition-colors"
                      style={{
                        background: m.model === model ? colors.bgHover : 'transparent',
                        color: colors.text,
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{m.model}</span>
                        <span style={{ color: colors.textMuted }}>{m.provider}</span>
                      </div>
                      {m.model === model && (
                        <div className="w-2 h-2 rounded-full" style={{ background: colors.accent }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Web research toggle */}
          <button
            onClick={onToggleWebResearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: webResearch ? colors.accent + '20' : colors.bgTertiary,
              color: webResearch ? colors.accent : colors.textSecondary,
              border: `1px solid ${webResearch ? colors.accent + '40' : colors.border}`,
            }}
          >
            <Globe size={12} />
            Web Research
          </button>
        </div>

        {/* Input area */}
        <div
          className="flex items-end gap-2 rounded-2xl p-2 transition-colors"
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* Attach button */}
          <button
            disabled={disabled}
            className="flex-shrink-0 p-2 rounded-lg transition-colors disabled:opacity-40"
            style={{ color: colors.textSecondary }}
            title="Attach file (coming soon)"
          >
            <Paperclip size={18} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask anything. Examine the evidence. Understand the answer."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-sm py-2 max-h-48"
            style={{ color: colors.text }}
          />

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{
                background: colors.error,
                color: '#ffffff',
              }}
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() ? colors.accent : colors.bgTertiary,
                color: input.trim() ? colors.accentText : colors.textMuted,
              }}
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs mt-2" style={{ color: colors.textMuted }}>
          NEXUS AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
