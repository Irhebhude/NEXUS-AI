import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, Globe, ChevronDown, BrainCircuit } from 'lucide-react';
import { getAllModels } from '@/lib/providers';
import type { ThemeColors } from '@/lib/theme';
import type { IntelligenceMode } from '@/lib/types';

interface ComposerProps {
  onSend: (content: string, webResearch?: boolean) => void;
  onStop: () => void;
  isStreaming: boolean;
  model: string;
  onModelChange: (model: string) => void;
  colors: ThemeColors;
  webResearch: boolean;
  onToggleWebResearch: () => void;
  intelligenceMode: IntelligenceMode;
  onIntelligenceModeChange: (mode: IntelligenceMode) => void;
  aiAvailable: boolean;
}

export function Composer({
  onSend,
  onStop,
  isStreaming,
  model,
  onModelChange,
  colors,
  webResearch,
  onToggleWebResearch,
  intelligenceMode,
  onIntelligenceModeChange,
  aiAvailable,
}: ComposerProps) {
  const [input, setInput] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isStreaming || !aiAvailable) return;
    onSend(input.trim(), webResearch);
    setInput('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const maxSize = 1024 * 1024;
    const allowedExtensions = /\.(txt|md|markdown|csv|json|log)$/i;
    if (!allowedExtensions.test(file.name) || file.size > maxSize) {
      setAttachmentError('Choose a text, Markdown, CSV, JSON, or log file under 1 MB.');
      return;
    }

    try {
      const text = await file.text();
      setInput((current) => `${current}${current ? '\n\n' : ''}[Attached file: ${file.name}]\n${text}`);
      setAttachmentError(null);
    } catch {
      setAttachmentError('This file could not be read. Try another text file.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative z-20 w-full flex-shrink-0 px-4 pb-4 pt-2 safe-bottom pointer-events-auto" style={{ background: colors.bg }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <label
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
            style={{
              background: colors.bgTertiary,
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
            }}
          >
            <BrainCircuit size={13} />
            <select
              value={intelligenceMode}
              onChange={(event) => onIntelligenceModeChange(event.target.value as IntelligenceMode)}
              aria-label="Intelligence mode"
              className="bg-transparent outline-none"
              style={{ color: colors.textSecondary }}
            >
              <option value="auto">Auto</option>
              <option value="general">General AI</option>
              <option value="reasoning">Reasoning</option>
              <option value="research">Research</option>
              <option value="action">Action Tools</option>
            </select>
          </label>

          <div className="relative" ref={modelMenuRef}>
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              disabled={!aiAvailable}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
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

          <button
            onClick={onToggleWebResearch}
            disabled={!aiAvailable}
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

        <div
          className="flex items-end gap-2 rounded-2xl p-2 transition-colors"
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
          }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || !aiAvailable}
            className="flex-shrink-0 p-2 rounded-lg transition-colors disabled:opacity-40"
            style={{ color: colors.textSecondary }}
            title="Attach a text file"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.csv,.json,.log,text/plain,text/markdown,text/csv,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || !aiAvailable}
            aria-label="Message NEXUS AI"
            placeholder={aiAvailable ? 'Ask anything. Examine the evidence. Understand the answer.' : 'Add your Groq API key to enable AI features.'}
            rows={1}
            className="min-w-0 flex-1 resize-none bg-transparent outline-none text-sm py-2 max-h-48 disabled:opacity-60"
            style={{ color: colors.text }}
          />

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
              disabled={!input.trim() || isStreaming || !aiAvailable}
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

        {attachmentError && (
          <p className="text-xs mt-2" style={{ color: colors.error }}>
            {attachmentError}
          </p>
        )}

        <p className="text-center text-xs mt-2" style={{ color: colors.textMuted }}>
          NEXUS AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
