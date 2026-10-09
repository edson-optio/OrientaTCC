/**
 * Componente Orientação: vínculo entre orientador e orientando, iniciado por
 * um convite que o professor aceita ou recusa.
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, timestamps } from "./_comum";
import { usuarios } from "./cadastros";
import { trabalhos } from "./trabalho";

export const STATUS_CONVITE = ["pendente", "aceito", "recusado"] as const;
export type StatusConvite = (typeof STATUS_CONVITE)[number];

export const convites_orientacao = sqliteTable("convites_orientacao", {
  id: id(),
  trabalho_id: integer("trabalho_id")
    .notNull()
    .references(() => trabalhos.id),
  orientador_id: integer("orientador_id")
    .notNull()
    .references(() => usuarios.id),
  status: text("status", { enum: STATUS_CONVITE })
    .notNull()
    .default("pendente"),
  /** Motivo informado pelo professor ao recusar. */
  justificativa: text("justificativa"),
  respondido_em: integer("respondido_em", { mode: "timestamp" }),
  ...timestamps,
});
