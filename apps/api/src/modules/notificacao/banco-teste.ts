/**
 * Banco SQLite em memória para os testes do repositório. As tabelas são
 * criadas a partir do schema Drizzle (via API do drizzle-kit), então ficam
 * sempre sincronizadas com `src/db/schema` sem depender da pasta `drizzle/`.
 * Uso exclusivo em testes; não importar no código da aplicação.
 */
import { Database } from "bun:sqlite";
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/bun-sqlite";

import type { Db } from "../../db";
import * as schema from "../../db/schema";

export async function criarBancoMemoria(): Promise<{ db: Db; sqlite: Database }> {
  const vazio = await generateSQLiteDrizzleJson({});
  const atual = await generateSQLiteDrizzleJson(schema);
  const comandos = await generateSQLiteMigration(vazio, atual);

  const sqlite = new Database(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  for (const comando of comandos) sqlite.exec(comando);

  const db = drizzle({ client: sqlite, schema });
  return { db, sqlite };
}
