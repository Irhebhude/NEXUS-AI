// LanceDB adapter — in-browser vector database using cosine similarity
// Implements a LanceDB-compatible interface with IndexedDB persistence
import { openDB, type IDBPDatabase } from 'idb';
import type { DatabaseAdapter, DatabaseEngineInfo, QueryResult } from './types';

interface LanceVector {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class LanceDBAdapter implements DatabaseAdapter {
  id = 'lancedb' as const;
  private idb: IDBPDatabase | null = null;
  private cache: Map<string, LanceVector> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.idb = await openDB('nexus-lancedb', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('vectors')) {
          db.createObjectStore('vectors', { keyPath: 'id' });
        }
      },
    });
    const all = await this.idb.getAll('vectors');
    for (const item of all) {
      const v = item as LanceVector;
      this.cache.set(v.id, v);
    }
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async addVector(id: string, vector: number[], metadata: Record<string, unknown> = {}): Promise<QueryResult> {
    if (!this.idb) return { error: 'LanceDB not initialized' };
    const entry: LanceVector = { id, vector, metadata };
    await this.idb.put('vectors', entry);
    this.cache.set(id, entry);
    return { changes: 1, message: 'OK' };
  }

  async similaritySearch(query: number[], topK = 5): Promise<{ id: string; score: number; metadata: Record<string, unknown> }[]> {
    const results: { id: string; score: number; metadata: Record<string, unknown> }[] = [];
    for (const [id, entry] of this.cache) {
      const score = cosineSim(query, entry.vector);
      results.push({ id, score, metadata: entry.metadata });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async execute(sql: string): Promise<QueryResult> {
    return { error: 'LanceDB is a vector database — SQL is not supported. Use put/get/delete/list.' };
  }

  async query(sql: string): Promise<QueryResult> {
    return { error: 'LanceDB is a vector database — SQL is not supported. Use put/get/delete/list.' };
  }

  async put(key: string, value: unknown): Promise<QueryResult> {
    if (Array.isArray(value)) {
      return this.addVector(key, value);
    }
    if (typeof value === 'object' && value !== null && 'vector' in value) {
      const v = value as { vector: number[]; metadata?: Record<string, unknown> };
      return this.addVector(key, v.vector, v.metadata || {});
    }
    return this.addVector(key, [0], { value });
  }

  async get(key: string): Promise<unknown> {
    const entry = this.cache.get(key);
    return entry || null;
  }

  async delete(key: string): Promise<QueryResult> {
    if (!this.idb) return { error: 'LanceDB not initialized' };
    await this.idb.delete('vectors', key);
    this.cache.delete(key);
    return { changes: 1, message: 'OK' };
  }

  async list(): Promise<{ key: string; value: unknown }[]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: { vector: entry.vector, metadata: entry.metadata },
    }));
  }

  async clear(): Promise<void> {
    if (!this.idb) return;
    await this.idb.clear('vectors');
    this.cache.clear();
  }

  async close(): Promise<void> {
    this.cache.clear();
    this.idb?.close();
    this.idb = null;
    this.initialized = false;
  }

  getInfo(): DatabaseEngineInfo {
    return {
      id: 'lancedb',
      name: 'LanceDB (Vector)',
      category: 'vector',
      description: 'Columnar vector database for ML embeddings and semantic search. IndexedDB-persisted with cosine similarity.',
      icon: 'Search',
      persistent: true,
      initialized: this.isInitialized(),
    };
  }
}
