// SQLite adapter — in-browser SQLite via sql.js (WASM), persisted to IndexedDB
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { openDB, type IDBPDatabase } from 'idb';
import type { DatabaseAdapter, DatabaseEngineInfo, QueryResult } from './types';

const IDB_NAME = 'nexus-sqlite';
const IDB_STORE = 'sqlite-store';
const IDB_KEY = 'sqlite-db';

export class SQLiteAdapter implements DatabaseAdapter {
  id = 'sqlite' as const;
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private idb: IDBPDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;
    this.SQL = await initSqlJs({ locateFile: (file: string) => `https://sql.js.org/dist/${file}` });
    this.idb = await openDB(IDB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      },
    });

    const savedData = await this.idb.get(IDB_STORE, IDB_KEY);
    if (savedData instanceof ArrayBuffer) {
      this.db = new this.SQL.Database(new Uint8Array(savedData));
    } else {
      this.db = new this.SQL.Database();
      this.db.run('CREATE TABLE IF NOT EXISTS nexus_data (key TEXT PRIMARY KEY, value TEXT, created_at TEXT DEFAULT (datetime(\'now\')))');
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    if (!this.db || !this.idb) return;
    const data = this.db.export();
    await this.idb.put(IDB_STORE, data.buffer, IDB_KEY);
  }

  isInitialized(): boolean {
    return this.db !== null;
  }

  async execute(sql: string): Promise<QueryResult> {
    if (!this.db) return { error: 'SQLite not initialized' };
    try {
      this.db.run(sql);
      await this.persist();
      return { changes: this.db.getRowsModified(), message: 'OK' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.db) return { error: 'SQLite not initialized' };
    try {
      const stmt = this.db.prepare(sql);
      const columns = stmt.getColumnNames();
      const rows: unknown[][] = [];
      while (stmt.step()) rows.push(stmt.get());
      stmt.free();
      return { columns, rows };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async put(key: string, value: unknown): Promise<QueryResult> {
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    return this.execute(
      `INSERT OR REPLACE INTO nexus_data (key, value) VALUES ('${key.replace(/'/g, "''")}', '${valStr.replace(/'/g, "''")}')`
    );
  }

  async get(key: string): Promise<unknown> {
    const result = await this.query(
      `SELECT value FROM nexus_data WHERE key = '${key.replace(/'/g, "''")}'`
    );
    if (result.error || !result.rows || result.rows.length === 0) return null;
    return result.rows[0][0];
  }

  async delete(key: string): Promise<QueryResult> {
    return this.execute(`DELETE FROM nexus_data WHERE key = '${key.replace(/'/g, "''")}'`);
  }

  async list(): Promise<{ key: string; value: unknown }[]> {
    const result = await this.query('SELECT key, value FROM nexus_data');
    if (result.error || !result.rows) return [];
    return result.rows.map((row) => ({ key: String(row[0]), value: row[1] }));
  }

  async clear(): Promise<void> {
    await this.execute('DELETE FROM nexus_data');
  }

  async close(): Promise<void> {
    this.db?.close();
    this.db = null;
  }

  getInfo(): DatabaseEngineInfo {
    return {
      id: 'sqlite',
      name: 'SQLite (sql.js)',
      category: 'relational',
      description: 'In-browser SQLite via WebAssembly, persisted to IndexedDB. Full SQL support with ACID transactions.',
      icon: 'Database',
      persistent: true,
      initialized: this.isInitialized(),
    };
  }
}
