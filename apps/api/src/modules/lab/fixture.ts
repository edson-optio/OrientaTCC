/** Cenário isolado usado exclusivamente nos testes e na demonstração. */
import { criarBancoMemoria } from '../notificacao/banco-teste';
import { usuarios, propostas, trabalhos, cronogramas, etapas } from '../../db/schema';
import { CronogramaConsulta } from '../cronograma/consulta';
import { EntregasService } from '../entregas/service';
import { FeedbackService } from '../feedback/service';
import type { Ator } from '../entregas/interface';
export const aluno: Ator = { id: 1, perfil: 'aluno' };
export const professor: Ator = { id: 2, perfil: 'professor' };
export const arquivo = { nome: 'tcc.pdf', conteudoBase64: Buffer.from('%PDF-1.4\n% Arquivo mínimo para teste de transporte\n%%EOF').toString('base64') };
export async function fixture() {
  const { db, sqlite } = await criarBancoMemoria();
  db.insert(usuarios).values([
    { id: 1, nome: 'Aluno', email: 'aluno@exemplo.edu.br', perfil: 'aluno' },
    { id: 2, nome: 'Orientador', email: 'prof@exemplo.edu.br', perfil: 'professor' },
  ]).run();
  db.insert(propostas).values({ id: 1, aluno_id: 1, professor_id: 2, tema: 'OrientaTCC', resumo: 'Resumo', objetivos: 'Objetivos', area_pesquisa: 'ES', status: 'aceita' }).run();
  db.insert(trabalhos).values({ id: 1, proposta_id: 1, aluno_id: 1, orientador_id: 2, titulo: 'OrientaTCC', status: 'em_orientacao' }).run();
  db.insert(cronogramas).values({ id: 1, trabalho_id: 1, publicado_em: new Date('2026-10-01T12:00:00Z') }).run();
  db.insert(etapas).values({ id: 1, cronograma_id: 1, nome: 'Entrega parcial', prazo: '2026-10-08' }).run();
  const agora = () => new Date('2026-10-08T23:00:00Z');
  const entregas = new EntregasService(db, new CronogramaConsulta(db), agora);
  return { db, sqlite, entregas, feedback: new FeedbackService(db, entregas, agora) };
}
