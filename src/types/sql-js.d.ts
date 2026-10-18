declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  interface Database {
    run(sql: string): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    getRowsModified(): number;
    close(): void;
  }

  interface Statement {
    getColumnNames(): string[];
    step(): boolean;
    get(): unknown[];
    free(): void;
  }

  interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  const initSqlJs: (options?: InitSqlJsOptions) => Promise<SqlJsStatic>;
  export default initSqlJs;
  export type { Database, SqlJsStatic };
}
