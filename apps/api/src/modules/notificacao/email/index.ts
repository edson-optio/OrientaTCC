/**
 * Fábrica da interface requerida IEmail: usa o Resend quando há chave de API
 * configurada e o ConsoleEmail (apenas log) nos demais casos.
 */
import type { IEmail } from "../interface";
import { ConsoleEmail } from "./console";
import { ResendEmail } from "./resend";

export { ConsoleEmail } from "./console";
export { ResendEmail } from "./resend";

export function criarEmail(env: NodeJS.ProcessEnv = process.env): IEmail {
  if (env.RESEND_API_KEY) {
    return new ResendEmail({
      apiKey: env.RESEND_API_KEY,
      remetente: env.RESEND_FROM,
    });
  }
  console.log(
    "[notificacao] RESEND_API_KEY ausente; e-mails serão apenas registrados no console.",
  );
  return new ConsoleEmail();
}
