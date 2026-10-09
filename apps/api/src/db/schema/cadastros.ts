/**
 * Componente Cadastros: usuários e perfis, cursos, semestres letivos e
 * parâmetros institucionais (IUsuario, IParametro) (UC10, UC12).
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { id, timestamps } from "./_comum";

export const PERFIS_USUARIO = ["aluno", "professor", "admin"] as const;
export type PerfilUsuario = (typeof PERFIS_USUARIO)[number];

export const cursos = sqliteTable("cursos", {
  id: id(),
  nome: text("nome").notNull(),
  sigla: text("sigla"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const semestres = sqliteTable("semestres", {
  id: id(),
  /** Ex.: "2026.1" */
  codigo: text("codigo").notNull().unique(),
  data_inicio: text("data_inicio").notNull(),
  data_fim: text("data_fim").notNull(),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

export const usuarios = sqliteTable("usuarios", {
  id: id(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  perfil: text("perfil", { enum: PERFIS_USUARIO }).notNull(),
  curso_id: integer("curso_id").references(() => cursos.id),
  /** Conta desativada pelo administrador (UC12) fica com ativo = false. */
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  /** Momento em que o e-mail institucional foi confirmado (UC10); nulo até confirmar. */
  email_confirmado_em: integer("email_confirmado_em", { mode: "timestamp" }),
  ...timestamps,
});

/**
 * Parâmetros do sistema editáveis pelo administrador (UC12), em linha única.
 * `limite_orientandos` é o limite de orientandos por professor;
 * `dominio_email` é o domínio institucional aceito no cadastro.
 */
export const parametros = sqliteTable("parametros", {
  id: id(),
  limite_orientandos: integer("limite_orientandos").notNull().default(5),
  dominio_email: text("dominio_email"),
  ...timestamps,
});
