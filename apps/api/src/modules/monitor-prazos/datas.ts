/** Utilitários de data do Monitor de Prazos (dias-calendário no fuso de São Paulo). */
import { FUSO_HORARIO } from "./interface";

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_HORARIO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data-calendário (AAAA-MM-DD) de um instante, no fuso de São Paulo. */
export function diaLocal(instante: Date): string {
  return formatoDia.format(instante);
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function diaParaUtc(dia: string): number {
  const [ano, mes, diaMes] = dia.split("-").map(Number);
  return Date.UTC(ano!, mes! - 1, diaMes!);
}

/** Dias inteiros entre hoje (fuso SP) e um prazo AAAA-MM-DD; negativo se vencido. */
export function diasAte(prazo: string, agora: Date): number {
  const prazoDia = prazo.slice(0, 10);
  return Math.round((diaParaUtc(prazoDia) - diaParaUtc(diaLocal(agora))) / MS_POR_DIA);
}

/** Subtrai dias de um instante. */
export function menosDias(instante: Date, dias: number): Date {
  return new Date(instante.getTime() - dias * MS_POR_DIA);
}
