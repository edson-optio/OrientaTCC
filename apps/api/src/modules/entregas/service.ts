import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { entregas, trabalhos, versoes } from '../../db/schema';
import { ErroDominio, type Ator, type ICronograma, type IEntrega, type Versao } from './interface';

export class EntregasService implements IEntrega {
  constructor(private db: Db, private cronograma: ICronograma, private agora = () => new Date()) {}
  private consulta() {
    return this.db.select({ id: versoes.id, entregaId: entregas.id, trabalhoId: entregas.trabalho_id,
      etapaId: entregas.etapa_id, numero: versoes.numero, arquivo: versoes.arquivo, nome: versoes.nome_original,
      alunoId: trabalhos.aluno_id, orientadorId: trabalhos.orientador_id, status: entregas.status })
      .from(versoes).innerJoin(entregas, eq(versoes.entrega_id, entregas.id))
      .innerJoin(trabalhos, eq(entregas.trabalho_id, trabalhos.id));
  }
  private permitir(ator: Ator, aluno: number, orientador: number | null) {
    if (!(ator.perfil === 'aluno' && ator.id === aluno) && !(ator.perfil === 'professor' && ator.id === orientador))
      throw new ErroDominio(403, 'Usuário não participa deste trabalho.');
  }
  submeterEntrega(ator: Ator, trabalhoId: number, etapaId: number, arquivo: { nome: string; conteudoBase64: string }): Versao {
    const referencia = this.agora();
    const etapa = this.cronograma.consultarEtapaVigente(trabalhoId, etapaId, referencia);
    if (ator.perfil !== 'aluno' || etapa.alunoId !== ator.id) throw new ErroDominio(403, 'Somente o aluno do trabalho pode entregar.');
    const bytes = Buffer.from(arquivo.conteudoBase64, 'base64');
    if (!arquivo.nome.toLowerCase().endsWith('.pdf') || arquivo.nome.length > 200 || /[/\\]/.test(arquivo.nome)
      || bytes.length > 2 * 1024 * 1024 || bytes.subarray(0, 5).toString() !== '%PDF-'
      || bytes.toString('base64') !== arquivo.conteudoBase64)
      throw new ErroDominio(400, 'Envie um PDF em base64 canônico de até 2 MiB, com nome sem caminhos.');
    return this.db.transaction(() => {
      let entrega = this.db.select().from(entregas).where(and(eq(entregas.trabalho_id, trabalhoId), eq(entregas.etapa_id, etapaId))).get();
      const status = etapa.prazoVencido ? 'entregue_com_atraso' : 'entregue';
      if (!entrega) entrega = this.db.insert(entregas).values({ trabalho_id: trabalhoId, etapa_id: etapaId, status }).returning().get();
      const ultima = this.db.select().from(versoes).where(eq(versoes.entrega_id, entrega.id)).orderBy(desc(versoes.numero)).get();
      const v = this.db.insert(versoes).values({ entrega_id: entrega.id, numero: (ultima?.numero ?? 0) + 1,
        arquivo: `data:application/pdf;base64,${arquivo.conteudoBase64}`, nome_original: arquivo.nome, enviada_por_id: ator.id }).returning().get();
      this.db.update(entregas).set({ status, atualizado_em: this.agora() }).where(eq(entregas.id, entrega.id)).run();
      return this.consultarVersao(ator, v.id);
    });
  }
  listarVersoes(ator: Ator, trabalhoId: number, etapaId: number) {
    const trabalho = this.db.select().from(trabalhos).where(eq(trabalhos.id, trabalhoId)).get();
    if (!trabalho) throw new ErroDominio(404, 'Trabalho não encontrado.');
    this.permitir(ator, trabalho.aluno_id, trabalho.orientador_id);
    return this.consulta().where(and(eq(entregas.trabalho_id, trabalhoId), eq(entregas.etapa_id, etapaId))).orderBy(versoes.numero).all();
  }
  consultarVersao(ator: Ator, versaoId: number) {
    const v = this.consulta().where(eq(versoes.id, versaoId)).get();
    if (!v) throw new ErroDominio(404, 'Versão não encontrada.');
    this.permitir(ator, v.alunoId, v.orientadorId);
    return v;
  }
  listarEntregasPendentes(ator: Ator) {
    if (ator.perfil !== 'professor') throw new ErroDominio(403, 'Operação exclusiva do orientador.');
    const todas = this.consulta().where(eq(trabalhos.orientador_id, ator.id)).orderBy(desc(versoes.numero)).all();
    const vistas = new Set<number>();
    return todas.filter(v => {
      if (vistas.has(v.entregaId)) return false;
      vistas.add(v.entregaId);
      return v.status === 'entregue' || v.status === 'entregue_com_atraso';
    });
  }
  atualizarSituacao(ator: Ator, versaoId: number, parecer: 'aprovado' | 'revisar') {
    const v = this.consultarVersao(ator, versaoId);
    if (ator.perfil !== 'professor' || ator.id !== v.orientadorId) throw new ErroDominio(403, 'Somente o orientador pode avaliar.');
    const ultima = this.db.select().from(versoes).where(eq(versoes.entrega_id, v.entregaId)).orderBy(desc(versoes.numero)).get()!;
    if (ultima.id !== versaoId || !['entregue', 'entregue_com_atraso'].includes(v.status))
      throw new ErroDominio(409, 'Somente a última versão pendente pode ser avaliada.');
    this.db.update(entregas).set({ status: parecer === 'aprovado' ? 'aprovada' : 'em_revisao', atualizado_em: this.agora() }).where(eq(entregas.id, v.entregaId)).run();
  }
}
