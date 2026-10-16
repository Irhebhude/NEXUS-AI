// LevelDB adapter — in-browser key-value store via level-js (IndexedDB-backed)
import Level from 'level-js';
import type { DatabaseAdapter, DatabaseEngineInfo, QueryResult } from './types';

export class LevelDBAdapter implements DatabaseAdapter {
  id = 'leveldb' as const;
  private db: Level | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;
    this.db = new Level('nexus-leveldb', { version: 1 });
  }

  isInitialized(): boolean {
    return this.db !== null;
  }

  async execute(sql: string): Promise<QueryResult> {
    return { error: 'LevelDB is a key-value store — SQL is not supported. Use put/get/delete/list.' };
  }

  async query(sql: string): Promise<QueryResult> {
    return { error: 'LevelDB is a key-value store — SQL is not supported. Use put/get/delete/list.' };
  }

  async put(key: string, value: unknown): Promise<QueryResult> {
    if (!this.db) return { error: 'LevelDB not initialized' };
    try {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      await this.db.put(key, valStr);
      return { changes: 1, message: 'OK' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async get(key: string): Promise<unknown> {
    if (!this.db) return null;
    try {
      const value = await this.db.get(key, { asBuffer: false });
      return value;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<QueryResult> {
    if (!this.db) return { error: 'LevelDB not initialized' };
    try {
      await this.db.del(key);
      return { changes: 1, message: 'OK' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async list(): Promise<{ key: string; value: unknown }[]> {
    if (!this.db) return [];
    const results: { key: string; value: unknown }[] = [];
    return new Promise((resolve) => {
      const stream = this.db!.createReadStream();
      stream.on('data', (data: { key: string; value: unknown }) => {
        results.push({ key: String(data.key), value: data.value });
      });
      stream.on('end', () => resolve(results));
      stream.on('error', () => resolve(results));
    });
  }

  async clear(): Promise<void> {
    if (!this.db) return;
    const items = await this.list();
    for (const item of items) {
      await this.db.del(item.key);
    }
  }

  async close(): Promise<void> {
    await this.db?.close();
    this.db = null;
  }

  getInfo(): DatabaseEngineInfo {
    return {
      id: 'leveldb',
      name: 'LevelDB (level-js)',
      category: 'key-value',
      description: 'Fast key-value store backed by IndexedDB. Ordered iteration, batch writes, ideal for caching and logs.',
      icon: 'Layers',
      persistent: true,
      initialized: this.isInitialized(),
    };
  }
}
