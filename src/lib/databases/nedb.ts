// NeDB adapter — in-browser document store using a lightweight in-memory implementation
// NeDB's npm package uses Node.js modules, so we implement a compatible document store
import type { DatabaseAdapter, DatabaseEngineInfo, QueryResult } from './types';

interface Doc {
  _id: string;
  [key: string]: unknown;
}

export class NeDBAdapter implements DatabaseAdapter {
  id = 'nedb' as const;
  private collection: Map<string, Doc> = new Map();

  async initialize(): Promise<void> {
    if (this.collection.size > 0) return;
  }

  isInitialized(): boolean {
    return this.collection.size >= 0;
  }

  async execute(sql: string): Promise<QueryResult> {
    return { error: 'NeDB is a document store — SQL is not supported. Use put/get/delete/list.' };
  }

  async query(sql: string): Promise<QueryResult> {
    return { error: 'NeDB is a document store — SQL is not supported. Use put/get/delete/list.' };
  }

  async put(key: string, value: unknown): Promise<QueryResult> {
    try {
      const doc: Doc = { _id: key, ...(typeof value === 'object' && value !== null ? value as Record<string, unknown> : { value }) };
      this.collection.set(key, doc);
      return { changes: 1, message: 'OK' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async get(key: string): Promise<unknown> {
    return this.collection.get(key) ?? null;
  }

  async delete(key: string): Promise<QueryResult> {
    const existed = this.collection.delete(key);
    return { changes: existed ? 1 : 0, message: 'OK' };
  }

  async list(): Promise<{ key: string; value: unknown }[]> {
    return Array.from(this.collection.entries()).map(([key, doc]) => ({ key, value: doc }));
  }

  async clear(): Promise<void> {
    this.collection.clear();
  }

  async close(): Promise<void> {
    this.collection.clear();
  }

  getInfo(): DatabaseEngineInfo {
    return {
      id: 'nedb',
      name: 'NeDB (In-Memory)',
      category: 'document',
      description: 'Lightweight embedded document store (MongoDB-like API). In-memory with optional persistence.',
      icon: 'FileJson',
      persistent: false,
      initialized: this.isInitialized(),
    };
  }
}
