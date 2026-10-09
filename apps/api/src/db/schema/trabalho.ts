/**
 * Componente Trabalho: ciclo de vida do Trabalho de TCC criado a partir de
 * uma proposta aceita e resultado final registrado pelo orientador (UC02, UC08).
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, timestamps } from "./_comum";
import { semestres, usuarios } from "./cadastros";
import { propostas } from "./proposta";

export const STATUS_TRABALHO = [
  "aguardando_orientador",
  "em_orientacao",
  "concluido",
] as const;
export type StatusTrabalho = (typeof STATUS_TRABALHO)[number];

export const RESULTADOS_FINAIS = [
  "aprovado",
  "aprovado_ressalvas",
  "reprovado",
] as const;
export type ResultadoFinal = (typeof RESULTADOS_FINAIS)[number];

export const trabalhos = sqliteTable("trabalhos", {
  id: id(),
  proposta_id: integer("proposta_id")
    .notNull()
    .unique()
    .references(() => propostas.id),
  aluno_id: integer("aluno_id")
    .notNull()
    .references(() => usuarios.id),
  orientador_id: integer("orientador_id").references(() => usuarios.id),
  semestre_id: integer("semestre_id").references(() => semestres.id),
  titulo: text("titulo").notNull(),
  status: text("status", { enum: STATUS_TRABALHO })
    .notNull()
    .default("aguardando_orientador"),
  /** Resultado final registrado pelo orientador (UC08); nulo até concluir. */
  resultado_final: text("resultado_final", { enum: RESULTADOS_FINAIS }),
  /** Parecer conclusivo do orientador (UC08 passo 3). */
  parecer_conclusivo: text("parecer_conclusivo"),
  /** Prazo (ISO 8601) para entrega da versão corrigida quando aprovado com ressalvas (UC08 A2). */
  prazo_correcao: text("prazo_correcao"),
  concluido_em: integer("concluido_em", { mode: "timestamp" }),
  ...timestamps,
});
