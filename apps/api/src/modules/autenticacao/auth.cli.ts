/**
 * Configuração usada SOMENTE pelo CLI do Better Auth para gerar o schema das
 * tabelas (user, session, account, verification):
 *
 *   bunx @better-auth/cli generate --config src/modules/autenticacao/auth.cli.ts --output src/db/schema/auth.ts
 *
 * O CLI roda em Node e não resolve `bun:sqlite`, então aqui o Drizzle é
 * instanciado com o driver `sqlite-proxy` (sem conexão real): a geração do
 * schema só precisa do provider e dos campos adicionais configurados.
 */
import { drizzle } from "drizzle-orm/sqlite-proxy";

import type { Db } from "../../db";
import * as schema from "../../db/schema";
import { criarAuth } from "./config";

const dbFalso = drizzle(async () => ({ rows: [] }), { schema }) as unknown as Db;

export const auth = criarAuth({
  db: dbFalso,
  email: { enviarEmail: async () => ({ id: "cli" }) },
});
