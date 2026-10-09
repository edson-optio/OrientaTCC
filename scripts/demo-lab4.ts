import { aluno, professor, arquivo, fixture } from '../apps/api/src/modules/lab/fixture';
const f = await fixture();
try {
  const v1 = f.entregas.submeterEntrega(aluno, 1, 1, arquivo);
  console.log('1. Aluno envia versão', v1.numero, '→', v1.status);
  console.log('2. Orientador consulta pendentes:', f.entregas.listarEntregasPendentes(professor).length);
  f.feedback.registrarFeedback(professor, v1.id, 'revisar', 'Detalhar metodologia');
  console.log('3. Feedback solicita revisão →', f.entregas.consultarVersao(aluno, v1.id).status);
  const v2 = f.entregas.submeterEntrega(aluno, 1, 1, arquivo);
  const parecer = f.feedback.registrarFeedback(professor, v2.id, 'aprovado', 'Ajustes atendidos');
  console.log('4. Nova versão', v2.numero, '→', f.entregas.consultarVersao(aluno, v2.id).status);
  console.log('5. Histórico preservado:', f.entregas.listarVersoes(aluno, 1, 1).map(v => v.numero));
  console.log('6. Feedbacks:', f.feedback.consultarFeedback(aluno, 1).map(f => f.parecer));
  console.log('7. Leitura registrada:', f.feedback.marcarFeedbackLido(aluno, parecer.id).lido_em?.toISOString());
} finally { f.sqlite.close(); }
