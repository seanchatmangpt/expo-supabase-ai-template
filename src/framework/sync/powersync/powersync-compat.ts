export class Schema {
  constructor(public tables: Table[]) {}
}

export class Table {
  public name: string;
  public columns: any[];
  constructor(options: { name: string; columns: any[] }) {
    this.name = options.name;
    this.columns = options.columns;
  }
}

export const column = {
  text: (name: string) => ({ name, type: 'TEXT' }),
  integer: (name: string) => ({ name, type: 'INTEGER' }),
  real: (name: string) => ({ name, type: 'REAL' }),
};

export interface CrudEntry {
  id: string;
  op: 'PUT' | 'PATCH' | 'DELETE';
  table: string;
  opData?: Record<string, any>;
}

export interface CrudTransaction {
  crud: CrudEntry[];
  complete(): Promise<void>;
}

export interface PowerSyncBackendConnector {
  fetchCredentials(): Promise<{ endpoint: string; token: string | null }>;
  uploadData(db: any): Promise<void>;
}

export class PowerSyncDatabase {
  public schema: Schema;
  public dbFilename: string;
  private tablesState = new Map<string, Map<string, any>>();
  private mutations: CrudEntry[] = [];

  constructor(options: { schema: Schema; database: { dbFilename: string } }) {
    this.schema = options.schema;
    this.dbFilename = options.database.dbFilename;
    this.clearAllTables();
  }

  private clearAllTables() {
    this.tablesState.set('profiles', new Map());
    this.tablesState.set('sync_admission_receipts', new Map());
    this.tablesState.set('sync_job_quarantine', new Map());
  }

  async initialize(): Promise<void> {
    this.clearAllTables();
  }

  async connect(connector: PowerSyncBackendConnector): Promise<void> {}

  async execute(sql: string, params: any[] = []): Promise<any> {
    const sqlNorm = sql.trim().replace(/\s+/g, ' ');
    const lower = sqlNorm.toLowerCase();

    // 1. DELETE query
    if (lower.startsWith('delete from')) {
      const parts = sqlNorm.split(' ');
      const tableName = parts[2].replace(/['"`]/g, '').trim();
      const table = this.tablesState.get(tableName);
      if (table) {
        table.clear();
      }
      return {
        rows: {
          length: 0,
          item: () => null,
        },
      };
    }

    // 2. SELECT query
    if (lower.startsWith('select')) {
      const fromIdx = lower.indexOf('from ');
      if (fromIdx !== -1) {
        const afterFrom = sqlNorm.substring(fromIdx + 5).trim();
        const tableName = afterFrom.split(' ')[0].replace(/['"`()]/g, '').trim();
        const table = this.tablesState.get(tableName);
        let rows = table ? Array.from(table.values()) : [];

        // Check for WHERE id = ?
        if (lower.includes('where id =') || lower.includes('where "id" =')) {
          const targetId = params[0];
          rows = rows.filter((r) => r.id === targetId);
        }

        // Check for ORDER BY
        if (lower.includes('order by')) {
          if (lower.includes('admitted_at desc')) {
            rows.sort((a, b) => {
              const comp = b.admitted_at.localeCompare(a.admitted_at);
              if (comp !== 0) return comp;
              return rows.indexOf(b) - rows.indexOf(a);
            });
          }
        }

        // Check for LIMIT
        if (lower.includes('limit 1')) {
          rows = rows.slice(0, 1);
        }

        return {
          rows: {
            length: rows.length,
            item: (index: number) => rows[index],
          },
        };
      }
    }

    // 3. INSERT query
    if (lower.startsWith('insert')) {
      const intoIdx = lower.indexOf('into ');
      if (intoIdx === -1) {
        return { rows: { length: 0, item: () => null } };
      }
      const afterInto = sqlNorm.substring(intoIdx + 5).trim();
      const tableName = afterInto.split(' ')[0].split('(')[0].replace(/['"`()]/g, '').trim();

      const colStart = sqlNorm.indexOf('(');
      const colEnd = sqlNorm.indexOf(')');
      const columns = sqlNorm
        .substring(colStart + 1, colEnd)
        .split(',')
        .map((c) => c.trim().replace(/['"`]/g, ''));

      const row: any = {};
      columns.forEach((col, idx) => {
        row[col] = params[idx];
      });

      // Ensure row has a unique identifier
      if (!row.id) {
        row.id = `gen_${Math.random().toString(36).substring(2)}`;
      }

      let table = this.tablesState.get(tableName);
      if (!table) {
        table = new Map();
        this.tablesState.set(tableName, table);
      }
      table.set(row.id, row);

      return {
        rows: {
          length: 0,
          item: () => null,
        },
      };
    }

    return {
      rows: {
        length: 0,
        item: () => null,
      },
    };
  }

  async writeTransaction(fn: (tx: any) => Promise<void>): Promise<void> {
    const tx = {
      execute: async (sql: string, params: any[] = []) => {
        await this.execute(sql, params);
      },
    };
    await fn(tx);
  }

  enqueueCrudEntry(entry: CrudEntry) {
    this.mutations.push(entry);
  }

  async getNextCrudTransaction(): Promise<CrudTransaction | null> {
    if (this.mutations.length === 0) {
      return null;
    }
    const chunk = [...this.mutations];
    return {
      crud: chunk,
      complete: async () => {
        this.mutations = this.mutations.filter((m) => !chunk.includes(m));
      },
    };
  }
}
