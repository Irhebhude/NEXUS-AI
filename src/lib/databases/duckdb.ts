// DuckDB adapter — in-browser analytical SQL engine via DuckDB-WASM
import { type AsyncDuckDB, type AsyncDuckDBConnection, type DuckDBBundle } from '@duckdb/duckdb-wasm';
import type { DatabaseAdapter, DatabaseEngineInfo, QueryResult } from './types';

export class DuckDBAdapter implements DatabaseAdapter {
  id = 'duckdb' as const;
  private db: AsyncDuckDB | null = null;
  private connection: AsyncDuckDBConnection | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;
    const duckdb = await import('@duckdb/duckdb-wasm');
    const bundle: DuckDBBundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    this.db = new duckdb.AsyncDuckDB(logger, worker);
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    await this.db.open({ path: ':memory:' });
    this.connection = await this.db.connect();
    await this.execute('CREATE TABLE IF NOT EXISTS nexus_data (key VARCHAR, value VARCHAR, created_at TIMESTAMP DEFAULT now())');
  }

  isInitialized(): boolean {
    return this.db !== null;
  }

  async execute(sql: string): Promise<QueryResult> {
    if (!this.db) return { error: 'DuckDB not initialized' };
    try {
      await this.connection?.query(sql);
      return { changes: 0, message: 'OK' };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.db) return { error: 'DuckDB not initialized' };
    try {
      if (!this.connection) return { error: 'DuckDB connection not initialized' };
      const result = await this.connection.query(sql) as any;
      const columns = result.schema.fields.map((field: { name: string }) => field.name);
      const rows: unknown[][] = result.toArray().map((row: Record<string, unknown>) =>
        columns.map((column: string) => row[column])
      );
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
      `SELECT value FROM nexus_data WHERE key = '${key.replace(/'/g, "''")}' LIMIT 1`
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
    await this.connection?.close();
    await this.db?.terminate();
    this.connection = null;
    this.db = null;
  }

  getInfo(): DatabaseEngineInfo {
    return {
      id: 'duckdb',
      name: 'DuckDB (WASM)',
      category: 'analytical',
      description: 'In-browser analytical SQL engine. Optimized for OLAP queries, aggregations, and large datasets.',
      icon: 'BarChart3',
      persistent: false,
      initialized: this.isInitialized(),
    };
  }
}
