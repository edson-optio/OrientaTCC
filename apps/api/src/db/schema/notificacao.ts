/**
 * Componente Notificação: notificações internas do aplicativo e controle do
 * envio de e-mail (UC07).
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, timestamps } from "./_comum";
import { usuarios } from "./cadastros";

export const notificacoes = sqliteTable("notificacoes", {
  id: id(),
  destinatario_id: integer("destinatario_id")
    .notNull()
    .references(() => usuarios.id),
  /** Ex.: "proposta_recebida", "prazo_proximo", "feedback_registrado". */
  tipo: text("tipo").notNull(),
  titulo: text("titulo").notNull(),
  mensagem: text("mensagem"),
  /** Dados adicionais (ids relacionados, etc.) em JSON. */
  dados: text("dados", { mode: "json" }).$type<Record<string, unknown>>(),
  lida_em: integer("lida_em", { mode: "timestamp" }),
  /** Momento em que o e-mail foi enviado; nulo enquanto pendente/reagendado. */
  enviada_em: integer("enviada_em", { mode: "timestamp" }),
  tentativas_envio: integer("tentativas_envio").notNull().default(0),
  ...timestamps,
});
