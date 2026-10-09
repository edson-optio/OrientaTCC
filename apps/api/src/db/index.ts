import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

/** Caminho do arquivo SQLite; relativo ao diretório de execução (apps/api). */
export const DATABASE_URL = process.env.DATABASE_URL ?? "./data/orientatcc.db";

// Garante que a pasta do arquivo exista (ex.: apps/api/data/) antes de abrir.
if (DATABASE_URL !== ":memory:") {
  mkdirSync(dirname(DATABASE_URL), { recursive: true });
}

const sqlite = new Database(DATABASE_URL, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

/** Instância do Drizzle compartilhada pela API. */
export const db = drizzle({ client: sqlite, schema });

export type Db = typeof db;
export { schema };
