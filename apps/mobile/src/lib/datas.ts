/**
 * Utilitarios de data em pt-BR. Prazos sao datas ISO (AAAA-MM-DD) e sao
 * comparados por dia, no fuso do aparelho.
 */

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** Converte "AAAA-MM-DD" (ou ISO completo) em Date local. */
export function lerData(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
  return new Date(iso);
}

/** Data ISO (AAAA-MM-DD) deslocada `dias` a partir de hoje. */
export function hojeMais(dias: number): string {
  const d = inicioDoDia(new Date());
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Dias inteiros de hoje ate a data (negativo se ja passou). */
export function diasAte(iso: string): number {
  const alvo = inicioDoDia(lerData(iso)).getTime();
  const hoje = inicioDoDia(new Date()).getTime();
  return Math.round((alvo - hoje) / MS_POR_DIA);
}

/** "07 out" */
export function diaMes(iso: string): string {
  const d = lerData(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

/** Partes separadas para o bloco de data: { dia: "07", mes: "out" }. */
export function partesData(iso: string): { dia: string; mes: string } {
  const d = lerData(iso);
  return { dia: String(d.getDate()).padStart(2, '0'), mes: MESES[d.getMonth()] };
}

/** "Qua, 14 out" */
export function hojeExtenso(): string {
  const d = new Date();
  return `${DIAS_SEMANA[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

/** "em 3 dias", "amanhã", "hoje", "venceu há 2 dias" */
export function prazoRelativo(iso: string): string {
  const dias = diasAte(iso);
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'amanhã';
  if (dias > 1) return `em ${dias} dias`;
  if (dias === -1) return 'venceu ontem';
  return `venceu há ${-dias} dias`;
}

/** "há 2 h", "há 3 dias", "agora" */
export function tempoDecorrido(iso: string): string {
  const minutos = Math.round((Date.now() - lerData(iso).getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ontem' : `há ${dias} dias`;
}

/** Iniciais de um nome, ignorando titulos como "Profa." e "Prof.". */
export function iniciais(nome: string): string {
  const partes = nome
    .split(/\s+/)
    .filter((p) => p && !/^prof(a)?\.?$/i.test(p) && !/^d(r|ra)\.?$/i.test(p));
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** "Bom dia", "Boa tarde" ou "Boa noite" conforme a hora do aparelho. */
export function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}
