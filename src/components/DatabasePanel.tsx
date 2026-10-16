import { useState, useEffect, useCallback } from 'react';
import {
  X, Database, BarChart3, Layers, FileJson, RefreshCw, Search,
  Play, Trash2, Plus, Server, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import type { ThemeColors } from '@/lib/theme';
import { dbManager } from '@/lib/databases/manager';
import type { DatabaseEngineId, DatabaseEngineInfo, QueryResult } from '@/lib/databases/types';

interface DatabasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  colors: ThemeColors;
}

const CATEGORY_COLORS: Record<string, string> = {
  relational: '#3b82f6',
  analytical: '#f59e0b',
  'key-value': '#10b981',
  document: '#8b5cf6',
  vector: '#ef4444',
};

const ICON_MAP: Record<string, typeof Database> = {
  Database,
  BarChart3,
  Layers,
  FileJson,
  RefreshCw,
  Search,
};

type Tab = 'overview' | 'query' | 'data' | 'vectors';

export function DatabasePanel({ isOpen, onClose, colors }: DatabasePanelProps) {
  const [engines, setEngines] = useState<DatabaseEngineInfo[]>([]);
  const [activeEngine, setActiveEngine] = useState<DatabaseEngineId>('sqlite');
  const [tab, setTab] = useState<Tab>('overview');
  const [sqlInput, setSqlInput] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [dataList, setDataList] = useState<{ key: string; value: unknown }[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [vectorInput, setVectorInput] = useState('');
  const [vectorMeta, setVectorMeta] = useState('');
  const [vectorResults, setVectorResults] = useState<{ id: string; score: number; metadata: Record<string, unknown> }[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; msg: string }>({ type: null, msg: '' });

  const refreshInfo = useCallback(() => {
    setEngines(dbManager.getAllInfo());
  }, []);

  useEffect(() => {
    if (isOpen) refreshInfo();
  }, [isOpen, refreshInfo]);

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: null, msg: '' }), 4000);
  };

  const handleInit = async (id: DatabaseEngineId) => {
    setStatus({ type: 'loading', msg: `Initializing ${id}...` });
    try {
      await dbManager.initialize(id);
      refreshInfo();
      showStatus('success', `${id} initialized successfully`);
    } catch (e) {
      showStatus('error', (e as Error).message);
    }
  };

  const handleRunQuery = async () => {
    if (!sqlInput.trim()) return;
    setQueryRunning(true);
    setQueryResult(null);
    try {
      const isSelect = /^\s*(SELECT|PRAGMA|SHOW|DESCRIBE|EXPLAIN)/i.test(sqlInput.trim());
      const result = isSelect
        ? await dbManager.query(activeEngine, sqlInput)
        : await dbManager.execute(activeEngine, sqlInput);
      setQueryResult(result);
      if (result.error) showStatus('error', result.error);
      else showStatus('success', isSelect ? `Query returned ${result.rows?.length ?? 0} rows` : `Executed (${result.changes ?? 0} changes)`);
    } catch (e) {
      showStatus('error', (e as Error).message);
    } finally {
      setQueryRunning(false);
    }
  };

  const handleAddData = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      let value: unknown = newValue;
      try { value = JSON.parse(newValue); } catch { /* keep as string */ }
      const result = await dbManager.put(activeEngine, newKey.trim(), value);
      if (result.error) showStatus('error', result.error);
      else {
        showStatus('success', 'Data saved');
        setNewKey('');
        setNewValue('');
        handleListData();
      }
    } catch (e) {
      showStatus('error', (e as Error).message);
    }
  };

  const handleListData = async () => {
    try {
      const items = await dbManager.list(activeEngine);
      setDataList(items);
    } catch (e) {
      showStatus('error', (e as Error).message);
    }
  };

  const handleDeleteData = async (key: string) => {
    await dbManager.delete(activeEngine, key);
    handleListData();
  };

  const handleClearData = async () => {
    await dbManager.clear(activeEngine);
    handleListData();
    showStatus('success', 'All data cleared');
  };

  const handleVectorSearch = async () => {
    const vec = vectorInput.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
    if (vec.length === 0) return;
    const adapter = await dbManager.ensureInitialized(activeEngine);
    if (dbManager.isVectorDB(activeEngine) && 'similaritySearch' in adapter) {
      const searchFn = (adapter as unknown as { similaritySearch: (q: number[], k?: number) => Promise<{ id: string; score: number; metadata: Record<string, unknown> }[]> }).similaritySearch;
      const results = await searchFn(vec, 5);
      setVectorResults(results);
    } else {
      showStatus('error', 'Selected engine does not support vector search');
    }
  };

  const handleAddVector = async () => {
    const vec = vectorInput.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
    if (vec.length === 0 || !newKey.trim()) return;
    let meta: Record<string, unknown> = {};
    try { meta = vectorMeta ? JSON.parse(vectorMeta) : {}; } catch { /* empty */ }
    const adapter = await dbManager.ensureInitialized(activeEngine);
    if (dbManager.isVectorDB(activeEngine) && 'addVector' in adapter) {
      const addFn = (adapter as unknown as { addVector: (k: string, v: number[], m?: Record<string, unknown>) => Promise<QueryResult> }).addVector;
      const result = await addFn(newKey.trim(), vec, meta);
      if (result.error) showStatus('error', result.error);
      else showStatus('success', 'Vector added');
    } else {
      showStatus('error', 'Selected engine does not support vectors');
    }
  };

  if (!isOpen) return null;

  const activeInfo = engines.find((e) => e.id === activeEngine);
  const supportsSQL = dbManager.supportsSQL(activeEngine);
  const isVector = dbManager.isVectorDB(activeEngine);
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'overview', label: 'Overview', show: true },
    { id: 'query', label: 'SQL Query', show: supportsSQL },
    { id: 'data', label: 'Data', show: true },
    { id: 'vectors', label: 'Vectors', show: isVector },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-none" style={{ background: 'transparent' }} onClick={onClose} />
      <div className="fixed right-0 top-0 h-dynamic-screen w-full max-w-2xl z-50 flex flex-col" style={{ background: colors.bg, borderLeft: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2">
            <Server size={18} style={{ color: colors.accent }} />
            <h2 className="text-base font-semibold" style={{ color: colors.text }}>Database Engines</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded" style={{ color: colors.textSecondary }}><X size={20} /></button>
        </div>

        <div className="flex gap-1 px-4 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {engines.map((engine) => {
            const Icon = ICON_MAP[engine.icon] || Database;
            const catColor = CATEGORY_COLORS[engine.category] || colors.accent;
            return (
              <button
                key={engine.id}
                onClick={() => setActiveEngine(engine.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                style={{
                  background: activeEngine === engine.id ? colors.bgTertiary : 'transparent',
                  color: activeEngine === engine.id ? colors.text : colors.textMuted,
                  border: `1px solid ${activeEngine === engine.id ? catColor + '40' : 'transparent'}`,
                }}
              >
                <Icon size={12} style={{ color: catColor }} />
                {engine.name.split(' ')[0]}
                {engine.initialized && <CheckCircle2 size={10} style={{ color: colors.success }} />}
              </button>
            );
          })}
        </div>

        {activeInfo && (
          <div className="px-4 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold" style={{ color: colors.text }}>{activeInfo.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: (CATEGORY_COLORS[activeInfo.category] || colors.accent) + '20', color: CATEGORY_COLORS[activeInfo.category] || colors.accent }}>
                {activeInfo.category}
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: colors.textMuted }}>{activeInfo.description}</p>
            <div className="flex items-center gap-3 text-xs" style={{ color: colors.textMuted }}>
              <span>Persistent: {activeInfo.persistent ? 'Yes' : 'No'}</span>
              <span>Status: {activeInfo.initialized ? 'Ready' : 'Not initialized'}</span>
              {!activeInfo.initialized && (
                <button onClick={() => handleInit(activeEngine)} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ background: colors.accent, color: colors.accentText }}>
                  <Plus size={10} /> Initialize
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-1 px-4 py-1.5 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {tabs.filter((t) => t.show).map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'data') handleListData(); }} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: tab === t.id ? colors.bgTertiary : 'transparent', color: tab === t.id ? colors.text : colors.textMuted }}>
              {t.label}
            </button>
          ))}
        </div>

        {status.type && (
          <div className="px-4 py-2 flex-shrink-0 flex items-center gap-2 text-xs" style={{ background: status.type === 'error' ? colors.errorBg : status.type === 'success' ? colors.success + '10' : colors.bgTertiary, color: status.type === 'error' ? colors.error : status.type === 'success' ? colors.success : colors.textSecondary }}>
            {status.type === 'loading' && <Loader2 size={12} className="animate-spin" />}
            {status.type === 'success' && <CheckCircle2 size={12} />}
            {status.type === 'error' && <AlertCircle size={12} />}
            {status.msg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'overview' && (
            <div className="space-y-3">
              {engines.map((engine) => {
                const Icon = ICON_MAP[engine.icon] || Database;
                const catColor = CATEGORY_COLORS[engine.category] || colors.accent;
                return (
                  <div key={engine.id} className="p-3 rounded-lg" style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: catColor + '20' }}>
                          <Icon size={16} style={{ color: catColor }} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold block" style={{ color: colors.text }}>{engine.name}</span>
                          <span className="text-xs" style={{ color: colors.textMuted }}>{engine.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {engine.initialized ? (
                          <span className="flex items-center gap-1 text-xs" style={{ color: colors.success }}><CheckCircle2 size={12} /> Ready</span>
                        ) : (
                          <button onClick={() => handleInit(engine.id)} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ background: colors.accent, color: colors.accentText }}>
                            <Plus size={10} /> Init
                          </button>
                        )}
                        <button onClick={() => setActiveEngine(engine.id)} className="px-2 py-1 rounded text-xs" style={{ background: colors.bgTertiary, color: colors.textSecondary }}>
                          Select
                        </button>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: colors.textMuted }}>{engine.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'query' && supportsSQL && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: colors.textSecondary }}>SQL Query</label>
                <textarea
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  placeholder="SELECT * FROM nexus_data LIMIT 10;"
                  rows={4}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg outline-none resize-none"
                  style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}`, fontFamily: "'SF Mono', monospace" }}
                />
              </div>
              <button onClick={handleRunQuery} disabled={queryRunning} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: colors.accent, color: colors.accentText }}>
                {queryRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Run Query
              </button>
              {queryResult && (
                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                  {queryResult.error ? (
                    <div className="p-3 text-xs" style={{ background: colors.errorBg, color: colors.error }}>{queryResult.error}</div>
                  ) : queryResult.rows && queryResult.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: colors.bgTertiary }}>
                            {(queryResult.columns || []).map((col) => (
                              <th key={col} className="px-3 py-2 text-left font-semibold" style={{ color: colors.text }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? colors.bgSecondary : colors.bg }}>
                              {row.map((cell, j) => (
                                <td key={j} className="px-3 py-2" style={{ color: colors.textSecondary }}>{String(cell)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 text-xs" style={{ background: colors.bgSecondary, color: colors.textMuted }}>
                      {queryResult.message || 'No rows returned'} — {queryResult.changes ?? 0} changes
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Key" className="flex-1 px-3 py-2 text-sm rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} />
                <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder='Value (text or JSON)' className="flex-1 px-3 py-2 text-sm rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} />
                <button onClick={handleAddData} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: colors.accent, color: colors.accentText }}><Plus size={14} /> Add</button>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={handleListData} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: colors.bgTertiary, color: colors.textSecondary }}><RefreshCw size={12} /> Refresh</button>
                <button onClick={handleClearData} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: colors.error + '15', color: colors.error }}><Trash2 size={12} /> Clear All</button>
              </div>
              <div className="space-y-1">
                {dataList.length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: colors.textMuted }}>No data yet. Add a key-value pair above.</p>
                ) : dataList.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-2 p-2.5 rounded-lg group" style={{ background: colors.bgSecondary }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold" style={{ color: colors.text }}>{item.key}</span>
                      <p className="text-xs truncate" style={{ color: colors.textMuted }}>{typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}</p>
                    </div>
                    <button onClick={() => handleDeleteData(item.key)} className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.error }}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'vectors' && isVector && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: colors.textSecondary }}>Add Vector</label>
                <div className="space-y-2">
                  <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Vector ID" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} />
                  <input type="text" value={vectorInput} onChange={(e) => setVectorInput(e.target.value)} placeholder="Comma-separated values: 0.1, 0.2, 0.3..." className="w-full px-3 py-2 text-sm font-mono rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} />
                  <input type="text" value={vectorMeta} onChange={(e) => setVectorMeta(e.target.value)} placeholder='Metadata (JSON): {"label": "example"}' className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} />
                  <button onClick={handleAddVector} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: colors.accent, color: colors.accentText }}><Plus size={14} /> Add Vector</button>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}` }} className="pt-3">
                <label className="text-xs font-semibold mb-1 block" style={{ color: colors.textSecondary }}>Similarity Search</label>
                <div className="flex gap-2">
                  <input type="text" value={vectorInput} onChange={(e) => setVectorInput(e.target.value)} placeholder="Query vector: 0.1, 0.2, 0.3..." className="flex-1 px-3 py-2 text-sm font-mono rounded-lg outline-none" style={{ background: colors.bgSecondary, color: colors.text, border: `1px solid ${colors.border}` }} />
                  <button onClick={handleVectorSearch} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium" style={{ background: colors.accent, color: colors.accentText }}><Search size={14} /> Search</button>
                </div>
                <div className="mt-2 space-y-1">
                  {vectorResults.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: colors.bgSecondary }}>
                      <span className="text-xs font-medium" style={{ color: colors.text }}>{r.id}</span>
                      <span className="text-xs" style={{ color: colors.accent }}>Score: {r.score.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
