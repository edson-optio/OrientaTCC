/**
 * Componente Entregas: entregas versionadas por etapa/trabalho e o feedback
 * do orientador vinculado à versão (UC04, UC05, UC06).
 */
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { id, timestamps } from "./_comum";
import { usuarios } from "./cadastros";
import { etapas } from "./cronograma";
import { trabalhos } from "./trabalho";

export const STATUS_ENTREGA = [
  "pendente",
  "entregue",
  "entregue_com_atraso",
  "atrasada",
  "em_revisao",
  "aprovada",
] as const;
export type StatusEntrega = (typeof STATUS_ENTREGA)[number];

export const PARECERES_FEEDBACK = ["aprovado", "revisar"] as const;
export type ParecerFeedback = (typeof PARECERES_FEEDBACK)[number];

export const entregas = sqliteTable(
  "entregas",
  {
    id: id(),
    trabalho_id: integer("trabalho_id")
      .notNull()
      .references(() => trabalhos.id),
    etapa_id: integer("etapa_id")
      .notNull()
      .references(() => etapas.id),
    status: text("status", { enum: STATUS_ENTREGA })
      .notNull()
      .default("pendente"),
    ...timestamps,
  },
  (t) => [unique("entregas_trabalho_etapa").on(t.trabalho_id, t.etapa_id)],
);

export const versoes = sqliteTable(
  "versoes",
  {
    id: id(),
    entrega_id: integer("entrega_id")
      .notNull()
      .references(() => entregas.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),
    /** Caminho/identificador do arquivo no Componente Arquivos. */
    arquivo: text("arquivo").notNull(),
    nome_original: text("nome_original"),
    enviada_por_id: integer("enviada_por_id").references(() => usuarios.id),
    ...timestamps,
  },
  (t) => [unique("versoes_entrega_numero").on(t.entrega_id, t.numero)],
);

export const feedbacks = sqliteTable("feedbacks", {
  id: id(),
  versao_id: integer("versao_id")
    .notNull()
    .references(() => versoes.id, { onDelete: "cascade" }),
  autor_id: integer("autor_id")
    .notNull()
    .references(() => usuarios.id),
  parecer: text("parecer", { enum: PARECERES_FEEDBACK }).notNull(),
  comentarios: text("comentarios"),
  lido_em: integer("lido_em", { mode: "timestamp" }),
  ...timestamps,
});
