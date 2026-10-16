// Database adapter type system — unified interface for multiple DB engines

export type DatabaseEngineId =
  | 'sqlite'
  | 'duckdb'
  | 'leveldb'
  | 'nedb'
  | 'rxdb'
  | 'sqlite-vss'
  | 'lancedb';

export interface DatabaseEngineInfo {
  id: DatabaseEngineId;
  name: string;
  category: 'relational' | 'key-value' | 'document' | 'vector' | 'analytical';
  description: string;
  icon: string;
  persistent: boolean;
  initialized: boolean;
}

export interface QueryResult {
  columns?: string[];
  rows?: unknown[][];
  changes?: number;
  message?: string;
  error?: string;
}

export interface DatabaseAdapter {
  id: DatabaseEngineId;
  initialize(): Promise<void>;
  isInitialized(): boolean;
  execute(sql: string): Promise<QueryResult>;
  query(sql: string): Promise<QueryResult>;
  put(key: string, value: unknown): Promise<QueryResult>;
  get(key: string): Promise<unknown>;
  delete(key: string): Promise<QueryResult>;
  list(): Promise<{ key: string; value: unknown }[]>;
  clear(): Promise<void>;
  close(): Promise<void>;
  getInfo(): DatabaseEngineInfo;
}
