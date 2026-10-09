import { db } from '../../db';
import { autenticacaoService } from '../autenticacao/routes';
import { CronogramaConsulta } from '../cronograma/consulta';
import { EntregasService } from '../entregas/service';
import { FeedbackService } from '../feedback/service';
import { criarRotasLab } from './routes';
const entregas = new EntregasService(db, new CronogramaConsulta(db));
const feedback = new FeedbackService(db, entregas);
export const lab = criarRotasLab(entregas, feedback, async headers => {
  const sessao = await autenticacaoService.obterSessao(headers);
  if (!sessao?.usuario.usuarioId) return null;
  return { id: sessao.usuario.usuarioId, perfil: sessao.usuario.perfil };
});
