// Unified DatabaseManager — orchestrates all database adapters
import type { DatabaseAdapter, DatabaseEngineId, DatabaseEngineInfo, QueryResult } from './types';
import { SQLiteAdapter } from './sqlite';
import { DuckDBAdapter } from './duckdb';
import { LevelDBAdapter } from './leveldb';
import { NeDBAdapter } from './nedb';
import { RxDBAdapter } from './rxdb';
import { SQLiteVSSAdapter } from './sqlite-vss';
import { LanceDBAdapter } from './lancedb';

class DatabaseManager {
  private adapters: Map<DatabaseEngineId, DatabaseAdapter> = new Map();
  private initializing: Set<DatabaseEngineId> = new Set();

  constructor() {
    this.adapters.set('sqlite', new SQLiteAdapter());
    this.adapters.set('duckdb', new DuckDBAdapter());
    this.adapters.set('leveldb', new LevelDBAdapter());
    this.adapters.set('nedb', new NeDBAdapter());
    this.adapters.set('rxdb', new RxDBAdapter());
    this.adapters.set('sqlite-vss', new SQLiteVSSAdapter());
    this.adapters.set('lancedb', new LanceDBAdapter());
  }

  getAdapter(id: DatabaseEngineId): DatabaseAdapter | undefined {
    return this.adapters.get(id);
  }

  getAllAdapters(): DatabaseAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAllInfo(): DatabaseEngineInfo[] {
    return this.getAllAdapters().map((a) => a.getInfo());
  }

  async initialize(id: DatabaseEngineId): Promise<void> {
    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`Unknown database engine: ${id}`);
    if (adapter.isInitialized() || this.initializing.has(id)) return;
    this.initializing.add(id);
    try {
      await adapter.initialize();
    } finally {
      this.initializing.delete(id);
    }
  }

  async ensureInitialized(id: DatabaseEngineId): Promise<DatabaseAdapter> {
    await this.initialize(id);
    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`Unknown database engine: ${id}`);
    return adapter;
  }

  async execute(id: DatabaseEngineId, sql: string): Promise<QueryResult> {
    const adapter = await this.ensureInitialized(id);
    return adapter.execute(sql);
  }

  async query(id: DatabaseEngineId, sql: string): Promise<QueryResult> {
    const adapter = await this.ensureInitialized(id);
    return adapter.query(sql);
  }

  async put(id: DatabaseEngineId, key: string, value: unknown): Promise<QueryResult> {
    const adapter = await this.ensureInitialized(id);
    return adapter.put(key, value);
  }

  async get(id: DatabaseEngineId, key: string): Promise<unknown> {
    const adapter = await this.ensureInitialized(id);
    return adapter.get(key);
  }

  async delete(id: DatabaseEngineId, key: string): Promise<QueryResult> {
    const adapter = await this.ensureInitialized(id);
    return adapter.delete(key);
  }

  async list(id: DatabaseEngineId): Promise<{ key: string; value: unknown }[]> {
    const adapter = await this.ensureInitialized(id);
    return adapter.list();
  }

  async clear(id: DatabaseEngineId): Promise<void> {
    const adapter = await this.ensureInitialized(id);
    await adapter.clear();
  }

  async close(id: DatabaseEngineId): Promise<void> {
    const adapter = this.adapters.get(id);
    if (adapter) await adapter.close();
  }

  async closeAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      await adapter.close();
    }
  }

  supportsSQL(id: DatabaseEngineId): boolean {
    const info = this.adapters.get(id)?.getInfo();
    return info?.category === 'relational' || info?.category === 'analytical';
  }

  isVectorDB(id: DatabaseEngineId): boolean {
    const info = this.adapters.get(id)?.getInfo();
    return info?.category === 'vector';
  }
}

export const dbManager = new DatabaseManager();
