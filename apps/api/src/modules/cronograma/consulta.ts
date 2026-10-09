import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { cronogramas, etapas, trabalhos } from '../../db/schema';
import { ErroDominio } from '../compartilhado/erro-dominio';
import type { ICronograma } from './interface';
export class CronogramaConsulta implements ICronograma {
  constructor(private db: Db) {}
  consultarEtapaVigente(trabalhoId: number, etapaId: number, referencia: Date) {
    if (!Number.isFinite(referencia.getTime())) throw new ErroDominio(400, 'Data de referência inválida.');
    const r = this.db.select({ id: etapas.id, prazo: etapas.prazo, alunoId: trabalhos.aluno_id,
      orientadorId: trabalhos.orientador_id, publicado: cronogramas.publicado_em, status: trabalhos.status })
      .from(etapas).innerJoin(cronogramas, eq(etapas.cronograma_id, cronogramas.id))
      .innerJoin(trabalhos, eq(cronogramas.trabalho_id, trabalhos.id))
      .where(and(eq(etapas.id, etapaId), eq(trabalhos.id, trabalhoId))).get();
    if (!r) throw new ErroDominio(404, 'Etapa não pertence ao trabalho.');
    if (!r.publicado || r.status !== 'em_orientacao') throw new ErroDominio(409, 'Cronograma não publicado ou trabalho fora de orientação.');
    const hoje = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(referencia);
    return { ...r, prazoVencido: hoje > r.prazo };
  }
}
