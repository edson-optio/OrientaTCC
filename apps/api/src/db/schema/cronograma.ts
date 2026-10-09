/**
 * Componente Cronograma: cronograma de entregas de cada trabalho e suas
 * etapas (nome, tipo, prazo, obrigatoriedade) (UC03).
 */
import { integer, sqliteTable, text, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { id, timestamps } from "./_comum";
import { usuarios } from "./cadastros";
import { trabalhos } from "./trabalho";

export const TIPOS_ETAPA = ["parcial", "final"] as const;
export type TipoEtapa = (typeof TIPOS_ETAPA)[number];

export const cronogramas = sqliteTable("cronogramas", {
  id: id(),
  trabalho_id: integer("trabalho_id")
    .notNull()
    .unique()
    .references(() => trabalhos.id),
  criado_por_id: integer("criado_por_id").references(() => usuarios.id),
  /** Cronograma de outro orientando usado como modelo (UC03 A2). */
  copiado_de: integer("copiado_de").references(
    (): AnySQLiteColumn => cronogramas.id,
  ),
  /** Nulo enquanto não publicado; publicado fica visível ao aluno (UC03 passo 3). */
  publicado_em: integer("publicado_em", { mode: "timestamp" }),
  ...timestamps,
});

export const etapas = sqliteTable("etapas", {
  id: id(),
  cronograma_id: integer("cronograma_id")
    .notNull()
    .references(() => cronogramas.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  tipo: text("tipo", { enum: TIPOS_ETAPA }).notNull().default("parcial"),
  /** Data limite (ISO 8601). */
  prazo: text("prazo").notNull(),
  obrigatoria: integer("obrigatoria", { mode: "boolean" })
    .notNull()
    .default(true),
  ordem: integer("ordem").notNull().default(0),
  ...timestamps,
});
