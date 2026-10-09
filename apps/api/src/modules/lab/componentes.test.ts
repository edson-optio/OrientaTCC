import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cronogramas, feedbacks, trabalhos } from '../../db/schema';
import { EntregasService } from '../entregas/service';
import { CronogramaConsulta } from '../cronograma/consulta';
import { FeedbackService } from '../feedback/service';
import { criarRotasLab } from './routes';
import { aluno, professor, arquivo, fixture } from './fixture';
let f: Awaited<ReturnType<typeof fixture>>;
beforeEach(async () => { f = await fixture(); });
afterEach(() => f.sqlite.close());
const enviar = () => f.entregas.submeterEntrega(aluno, 1, 1, arquivo);
describe('Entregas', () => {
  test('preserva arquivo e incrementa versões no prazo', () => {
    const a = enviar(); const b = enviar();
    expect([a.numero, b.numero]).toEqual([1, 2]);
    expect(b.status).toBe('entregue');
    expect(f.entregas.listarVersoes(aluno, 1, 1)).toHaveLength(2);
    expect(a.arquivo).toBe(`data:application/pdf;base64,${arquivo.conteudoBase64}`);
    expect(f.entregas.listarEntregasPendentes(professor).map(v => v.id)).toEqual([b.id]);
  });
  test('aceita entrega atrasada e respeita fuso de São Paulo', () => {
    const s = new EntregasService(f.db, new CronogramaConsulta(f.db), () => new Date('2026-10-09T02:59:59Z'));
    expect(s.submeterEntrega(aluno, 1, 1, arquivo).status).toBe('entregue');
    const tarde = new EntregasService(f.db, new CronogramaConsulta(f.db), () => new Date('2026-10-09T03:00:00Z'));
    expect(tarde.submeterEntrega(aluno, 1, 1, arquivo).status).toBe('entregue_com_atraso');
  });
  test('rejeita arquivo inválido sem criar versão', () => {
    expect(() => f.entregas.submeterEntrega(aluno, 1, 1, { nome: 'x.pdf', conteudoBase64: 'abc' })).toThrow();
    expect(f.entregas.listarVersoes(aluno, 1, 1)).toEqual([]);
  });
  test('rejeita terceiro e professor na submissão', () => {
    expect(() => f.entregas.submeterEntrega({ id: 9, perfil: 'aluno' }, 1, 1, arquivo)).toThrow();
    expect(() => f.entregas.submeterEntrega(professor, 1, 1, arquivo)).toThrow();
    const v = enviar();
    expect(() => f.entregas.consultarVersao({ id: 9, perfil: 'professor' }, v.id)).toThrow();
  });
  test('rejeita etapa inexistente e cronograma não publicado', () => {
    expect(() => f.entregas.submeterEntrega(aluno, 1, 999, arquivo)).toThrow();
    f.db.update(cronogramas).set({ publicado_em: null }).run();
    expect(enviar).toThrow();
  });
  test('rejeita submissão em trabalho concluído', () => {
    f.db.update(trabalhos).set({ status: 'concluido' }).run(); expect(enviar).toThrow();
  });
});
describe('Feedback', () => {
  test('rejeita parecer inválido, comentário vazio e versão inexistente', () => {
    expect(() => f.feedback.registrarFeedback(professor, 1, 'aprovado', ' ')).toThrow();
    expect(() => f.feedback.registrarFeedback(professor, 999, 'aprovado', 'Bom')).toThrow();
  });
  test('somente orientador avalia e somente aluno marca como lido', () => {
    const v = enviar();
    expect(() => f.feedback.registrarFeedback(aluno, v.id, 'aprovado', 'Bom')).toThrow();
    const r = f.feedback.registrarFeedback(professor, v.id, 'aprovado', 'Bom');
    expect(() => f.feedback.marcarFeedbackLido(professor, r.id)).toThrow();
    const lido = f.feedback.marcarFeedbackLido(aluno, r.id);
    expect(lido.lido_em).not.toBeNull();
    expect(f.feedback.marcarFeedbackLido(aluno, r.id).lido_em).toEqual(lido.lido_em);
    expect(f.feedback.consultarFeedback({ id: 9, perfil: 'aluno' }, 1)).toEqual([]);
  });
  test('impede avaliação duplicada', () => {
    const v = enviar(); f.feedback.registrarFeedback(professor, v.id, 'aprovado', 'Bom');
    expect(() => f.feedback.registrarFeedback(professor, v.id, 'revisar', 'Rever')).toThrow();
    expect(f.feedback.consultarFeedback(aluno, 1)).toHaveLength(1);
  });
});
describe('Integração Entregas e Feedback', () => {
  test('submissão → revisão → nova versão → aprovação → leitura', () => {
    const v1 = enviar(); f.feedback.registrarFeedback(professor, v1.id, 'revisar', 'Detalhar metodologia');
    expect(f.entregas.consultarVersao(aluno, v1.id).status).toBe('em_revisao');
    expect(f.entregas.listarEntregasPendentes(professor)).toEqual([]);
    const v2 = enviar(); const r = f.feedback.registrarFeedback(professor, v2.id, 'aprovado', 'Ajustes atendidos');
    expect(f.entregas.consultarVersao(aluno, v2.id).status).toBe('aprovada');
    expect(f.feedback.consultarFeedback(aluno, 1)).toHaveLength(2);
    expect(f.feedback.marcarFeedbackLido(aluno, r.id).lido_em).not.toBeNull();
  });
  test('versão antiga não muda estado e rollback remove feedback', () => {
    const v1 = enviar(); const v2 = enviar();
    expect(() => f.feedback.registrarFeedback(professor, v1.id, 'aprovado', 'Antiga')).toThrow();
    expect(f.db.select().from(feedbacks).all()).toEqual([]);
    expect(f.entregas.consultarVersao(aluno, v2.id).status).toBe('entregue');
  });
  test('falha após atualizar situação reverte ambas as gravações', () => {
    const v = enviar();
    const porta = {
      submeterEntrega: f.entregas.submeterEntrega.bind(f.entregas), listarVersoes: f.entregas.listarVersoes.bind(f.entregas),
      consultarVersao: f.entregas.consultarVersao.bind(f.entregas), listarEntregasPendentes: f.entregas.listarEntregasPendentes.bind(f.entregas),
      atualizarSituacao: (...args: Parameters<typeof f.entregas.atualizarSituacao>) => { f.entregas.atualizarSituacao(...args); throw new Error('Falha simulada'); },
    };
    expect(() => new FeedbackService(f.db, porta).registrarFeedback(professor, v.id, 'aprovado', 'Bom')).toThrow('Falha simulada');
    expect(f.db.select().from(feedbacks).all()).toEqual([]);
    expect(f.entregas.consultarVersao(aluno, v.id).status).toBe('entregue');
  });
  test('HTTP autenticação, validação e integração dos serviços reais', async () => {
    const app = criarRotasLab(f.entregas, f.feedback, async h => h.get('authorization') === 'aluno' ? aluno : h.get('authorization') === 'professor' ? professor : null);
    const req = (path: string, token?: string, body?: object) => app.handle(new Request(`http://localhost${path}`, {
      method: body ? 'POST' : 'GET', headers: { ...(token ? { authorization: token } : {}), 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    }));
    expect((await req('/entregas/pendentes')).status).toBe(401);
    expect((await req('/entregas', 'aluno', {})).status).toBe(422);
    const r = await req('/entregas', 'aluno', { trabalhoId: 1, etapaId: 1, arquivo }); expect(r.status).toBe(200);
    const v = await r.json() as { id: number };
    expect((await req('/feedbacks', 'aluno', { versaoId: v.id, parecer: 'aprovado', comentarios: 'Bom' })).status).toBe(403);
    expect((await req('/feedbacks', 'professor', { versaoId: v.id, parecer: 'aprovado', comentarios: 'Bom' })).status).toBe(200);
    expect((await req('/entregas/versoes/' + v.id, 'aluno')).status).toBe(200);
  });
});

describe('Responsabilidades revisadas do Lab 3', () => {
  test('Cronograma determina vencimento no limite do dia e rejeita data inválida', () => {
    const cronograma = new CronogramaConsulta(f.db);
    expect(cronograma.consultarEtapaVigente(1, 1, new Date('2026-10-09T02:59:59Z')).prazoVencido).toBe(false);
    expect(cronograma.consultarEtapaVigente(1, 1, new Date('2026-10-09T03:00:00Z')).prazoVencido).toBe(true);
    expect(() => cronograma.consultarEtapaVigente(1, 1, new Date('inválida'))).toThrow('Data de referência inválida');
  });
  test('Entregas usa a decisão de Cronograma sem reinterpretar a data', () => {
    const entregas = new EntregasService(f.db, {
      consultarEtapaVigente: () => ({ id: 1, prazo: '2099-01-01', prazoVencido: true, alunoId: 1, orientadorId: 2 }),
    });
    expect(entregas.submeterEntrega(aluno, 1, 1, arquivo).status).toBe('entregue_com_atraso');
  });
  test('parecer de revisão altera a entrega e preserva o prazo do cronograma', () => {
    const cronograma = new CronogramaConsulta(f.db);
    const referencia = new Date('2026-10-08T23:00:00Z');
    const antes = cronograma.consultarEtapaVigente(1, 1, referencia);
    const v = enviar();
    f.feedback.registrarFeedback(professor, v.id, 'revisar', 'Rever a conclusão');
    expect(f.entregas.consultarVersao(aluno, v.id).status).toBe('em_revisao');
    expect(cronograma.consultarEtapaVigente(1, 1, referencia)).toEqual(antes);
  });
});
