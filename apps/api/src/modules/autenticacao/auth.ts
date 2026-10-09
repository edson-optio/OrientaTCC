/**
 * Instância padrão do Better Auth da API: banco real (`src/db/index.ts`) e
 * IEmail configurado pelo ambiente (Resend ou console).
 */
import { db } from "../../db";
import { criarEmail } from "../notificacao/email";
import { criarAuth } from "./config";

export * from "./config";

export const auth = criarAuth({ db, email: criarEmail() });
