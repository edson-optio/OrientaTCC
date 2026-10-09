import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

/**
 * Colunas compartilhadas por todas as tabelas: chave primária inteira
 * autoincrementada e timestamps de auditoria (criado_em / atualizado_em),
 * armazenados como ISO 8601 (texto) via modo "timestamp" do SQLite.
 */
export const id = () => integer("id").primaryKey({ autoIncrement: true });

export const timestamps = {
  criado_em: integer("criado_em", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  atualizado_em: integer("atualizado_em", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
};
