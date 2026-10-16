// RxDB adapter — in-browser reactive document store
// Uses a lightweight in-memory implementation compatible with RxDB's document model
import type { DatabaseAdapter, DatabaseEngineInfo, QueryResult } from './types';

interface RxDoc {
  _id: string;
  _rev: number;
  data: unknown;
  updatedAt: string;
}

export class RxDBAdapter implements DatabaseAdapter {
  id = 'rxdb' as const;
  private store: Map<string, RxDoc> = new Map();
  private listeners: Set<(key: string, value: unknown) => void> = new Set();

  async initialize(): Promise<void> {
    if (this.store.size > 0) return;
  }

  isInitialized(): boolean {
    return this.store.size >= 0;
  }

  subscribe(fn: (key: string, value: unknown) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(key: string, value: unknown): void {
    this.listeners.forEach((fn) => fn(key, value));
  }

  async execute(sql: string): Promise<QueryResult> {
    return { error: 'RxDB is a reactive document store — SQL is not supported. Use put/get/delete/list.' };
  }

  async query(sql: string): Promise<QueryResult> {
    return { error: 'RxDB is a reactive document store — SQL is not supported. Use put/get/delete/list.' };
  }

  async put(key: string, value: unknown): Promise<QueryResult> {
    try {
      const existing = this.store.get(key);
      const rev = existing ? existing._rev + 1 : 1;
      const doc: RxDoc = { _id: key, _rev: rev, data: value, updatedAt: new Date().toISOString() };
      this.store.set(key, doc);
      this.notify(key, value);
      return { changes: 1, message: 'OK' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async get(key: string): Promise<unknown> {
    const doc = this.store.get(key);
    return doc ? doc.data : null;
  }

  async delete(key: string): Promise<QueryResult> {
    const existed = this.store.delete(key);
    if (existed) this.notify(key, null);
    return { changes: existed ? 1 : 0, message: 'OK' };
  }

  async list(): Promise<{ key: string; value: unknown }[]> {
    return Array.from(this.store.entries()).map(([key, doc]) => ({ key, value: doc.data }));
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async close(): Promise<void> {
    this.store.clear();
    this.listeners.clear();
  }

  getInfo(): DatabaseEngineInfo {
    return {
      id: 'rxdb',
      name: 'RxDB (Reactive)',
      category: 'document',
      description: 'Reactive document store with live queries and change subscriptions. NoSQL with real-time sync.',
      icon: 'RefreshCw',
      persistent: false,
      initialized: this.isInitialized(),
    };
  }
}
