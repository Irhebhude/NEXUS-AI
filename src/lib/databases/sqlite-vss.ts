// SQLite-VSS adapter — vector similarity search built on top of the SQLite adapter
import { SQLiteAdapter } from './sqlite';
import type { DatabaseAdapter, DatabaseEngineInfo, QueryResult } from './types';

interface VectorEntry {
  key: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class SQLiteVSSAdapter implements DatabaseAdapter {
  id = 'sqlite-vss' as const;
  private sqlite: SQLiteAdapter;
  private vectors: Map<string, VectorEntry> = new Map();

  constructor() {
    this.sqlite = new SQLiteAdapter();
  }

  async initialize(): Promise<void> {
    await this.sqlite.initialize();
    await this.sqlite.execute(
      `CREATE TABLE IF NOT EXISTS vectors (
        key TEXT PRIMARY KEY,
        vector TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`
    );
    const existing = await this.sqlite.query('SELECT key, vector, metadata FROM vectors');
    if (existing.rows) {
      for (const row of existing.rows) {
        const key = String(row[0]);
        const vector = JSON.parse(String(row[1])) as number[];
        const metadata = row[2] ? JSON.parse(String(row[2])) : {};
        this.vectors.set(key, { key, vector, metadata });
      }
    }
  }

  isInitialized(): boolean {
    return this.sqlite.isInitialized();
  }

  async addVector(key: string, vector: number[], metadata: Record<string, unknown> = {}): Promise<QueryResult> {
    const result = await this.sqlite.execute(
      `INSERT OR REPLACE INTO vectors (key, vector, metadata) VALUES ('${key.replace(/'/g, "''")}', '${JSON.stringify(vector)}', '${JSON.stringify(metadata).replace(/'/g, "''")}')`
    );
    if (!result.error) {
      this.vectors.set(key, { key, vector, metadata });
    }
    return result;
  }

  async similaritySearch(query: number[], topK = 5): Promise<{ key: string; score: number; metadata: Record<string, unknown> }[]> {
    const results: { key: string; score: number; metadata: Record<string, unknown> }[] = [];
    for (const [key, entry] of this.vectors) {
      const score = cosineSimilarity(query, entry.vector);
      results.push({ key, score, metadata: entry.metadata });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async execute(sql: string): Promise<QueryResult> {
    return this.sqlite.execute(sql);
  }

  async query(sql: string): Promise<QueryResult> {
    return this.sqlite.query(sql);
  }

  async put(key: string, value: unknown): Promise<QueryResult> {
    if (Array.isArray(value)) {
      return this.addVector(key, value);
    }
    return this.sqlite.put(key, value);
  }

  async get(key: string): Promise<unknown> {
    const entry = this.vectors.get(key);
    if (entry) return entry;
    return this.sqlite.get(key);
  }

  async delete(key: string): Promise<QueryResult> {
    this.vectors.delete(key);
    return this.sqlite.delete(key);
  }

  async list(): Promise<{ key: string; value: unknown }[]> {
    const vectorList = Array.from(this.vectors.entries()).map(([key, entry]) => ({
      key,
      value: { vector: entry.vector, metadata: entry.metadata },
    }));
    return vectorList;
  }

  async clear(): Promise<void> {
    this.vectors.clear();
    await this.sqlite.execute('DELETE FROM vectors');
  }

  async close(): Promise<void> {
    this.vectors.clear();
    await this.sqlite.close();
  }

  getInfo(): DatabaseEngineInfo {
    return {
      id: 'sqlite-vss',
      name: 'SQLite-VSS',
      category: 'vector',
      description: 'Vector similarity search on SQLite. Stores embeddings and performs cosine similarity queries.',
      icon: 'Search',
      persistent: true,
      initialized: this.isInitialized(),
    };
  }
}
