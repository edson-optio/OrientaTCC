import { Elysia, t } from 'elysia';
import { ErroDominio, type Ator, type IEntrega } from '../entregas/interface';
import type { IFeedback } from '../feedback/interface';
const id = t.Numeric({ minimum: 1, multipleOf: 1 });
export function criarRotasLab(entregas: IEntrega, feedback: IFeedback, autenticar: (h: Headers) => Promise<Ator | null>) {
  return new Elysia({ name: 'lab4' }).onError(({ error, status }) => {
    if (error instanceof ErroDominio) return status(error.status, { erro: error.message });
  }).resolve(async ({ request, status }) => {
    const ator = await autenticar(request.headers);
    if (!ator) return status(401, { erro: 'Faça login.' });
    return { ator };
  })
    .post('/entregas', ({ ator, body }) => entregas.submeterEntrega(ator, body.trabalhoId, body.etapaId, body.arquivo), {
      body: t.Object({ trabalhoId: id, etapaId: id, arquivo: t.Object({ nome: t.String(), conteudoBase64: t.String({ maxLength: 2796204 }) }) }) })
    .get('/entregas/versoes', ({ ator, query }) => entregas.listarVersoes(ator, query.trabalhoId, query.etapaId), { query: t.Object({ trabalhoId: id, etapaId: id }) })
    .get('/entregas/pendentes', ({ ator }) => entregas.listarEntregasPendentes(ator))
    .get('/entregas/versoes/:id', ({ ator, params }) => entregas.consultarVersao(ator, params.id), { params: t.Object({ id }) })
    .post('/feedbacks', ({ ator, body }) => feedback.registrarFeedback(ator, body.versaoId, body.parecer, body.comentarios), {
      body: t.Object({ versaoId: id, parecer: t.Union([t.Literal('aprovado'), t.Literal('revisar')]), comentarios: t.String({ minLength: 1, maxLength: 5000 }) }) })
    .get('/feedbacks', ({ ator, query }) => feedback.consultarFeedback(ator, query.trabalhoId), { query: t.Object({ trabalhoId: id }) })
    .patch('/feedbacks/:id/lido', ({ ator, params }) => feedback.marcarFeedbackLido(ator, params.id), { params: t.Object({ id }) });
}
