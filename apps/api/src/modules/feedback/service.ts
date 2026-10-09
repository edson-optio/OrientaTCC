import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { feedbacks } from '../../db/schema';
import { ErroDominio, type Ator, type IEntrega } from '../entregas/interface';
import type { IFeedback } from './interface';
export class FeedbackService implements IFeedback {
  constructor(private db: Db, private entregas: IEntrega, private agora = () => new Date()) {}
  registrarFeedback(ator: Ator, versaoId: number, parecer: 'aprovado' | 'revisar', comentarios: string) {
    if (!['aprovado', 'revisar'].includes(parecer) || !comentarios.trim() || comentarios.length > 5000)
      throw new ErroDominio(400, 'Parecer inválido ou comentário vazio/maior que 5000 caracteres.');
    return this.db.transaction(() => {
      const v = this.entregas.consultarVersao(ator, versaoId);
      if (ator.perfil !== 'professor' || ator.id !== v.orientadorId) throw new ErroDominio(403, 'Somente o orientador pode avaliar.');
      if (this.db.select().from(feedbacks).where(eq(feedbacks.versao_id, versaoId)).get()) throw new ErroDominio(409, 'Versão já avaliada.');
      const f = this.db.insert(feedbacks).values({ versao_id: versaoId, autor_id: ator.id, parecer, comentarios: comentarios.trim() }).returning().get();
      this.entregas.atualizarSituacao(ator, versaoId, parecer);
      return f;
    });
  }
  consultarFeedback(ator: Ator, trabalhoId: number) {
    // Acesso às versões ocorre exclusivamente pela interface requerida.
    return this.db.select().from(feedbacks).orderBy(feedbacks.id).all().filter(f => {
      try { return this.entregas.consultarVersao(ator, f.versao_id).trabalhoId === trabalhoId; }
      catch (erro) { if (erro instanceof ErroDominio && erro.status === 403) return false; throw erro; }
    });
  }
  marcarFeedbackLido(ator: Ator, feedbackId: number) {
    const f = this.db.select().from(feedbacks).where(eq(feedbacks.id, feedbackId)).get();
    if (!f) throw new ErroDominio(404, 'Feedback não encontrado.');
    const v = this.entregas.consultarVersao(ator, f.versao_id);
    if (ator.perfil !== 'aluno' || ator.id !== v.alunoId) throw new ErroDominio(403, 'Somente o aluno pode marcar a leitura.');
    if (f.lido_em) return f;
    return this.db.update(feedbacks).set({ lido_em: this.agora() }).where(eq(feedbacks.id, feedbackId)).returning().get();
  }
}
