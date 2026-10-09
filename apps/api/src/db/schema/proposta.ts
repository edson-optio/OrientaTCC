/**
 * Componente Proposta: propostas de tema submetidas pelo aluno a um
 * professor orientador escolhido por ele (UC01, UC02).
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, timestamps } from "./_comum";
import { usuarios } from "./cadastros";

export const STATUS_PROPOSTA = [
  "rascunho",
  "aguardando_orientador",
  "ajustes",
  "recusada",
  "aceita",
] as const;
export type StatusProposta = (typeof STATUS_PROPOSTA)[number];

export const propostas = sqliteTable("propostas", {
  id: id(),
  aluno_id: integer("aluno_id")
    .notNull()
    .references(() => usuarios.id),
  /** Professor escolhido pelo aluno como orientador (UC01 passo 3). */
  professor_id: integer("professor_id")
    .notNull()
    .references(() => usuarios.id),
  tema: text("tema").notNull(),
  resumo: text("resumo").notNull(),
  objetivos: text("objetivos").notNull(),
  area_pesquisa: text("area_pesquisa").notNull(),
  status: text("status", { enum: STATUS_PROPOSTA })
    .notNull()
    .default("rascunho"),
  /** Justificativa do professor ao devolver para ajustes ou recusar (UC02 A2/A3). */
  justificativa: text("justificativa"),
  submetida_em: integer("submetida_em", { mode: "timestamp" }),
  respondida_em: integer("respondida_em", { mode: "timestamp" }),
  ...timestamps,
});
