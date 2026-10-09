import { TelaPlaceholder } from '../../../src/components/TelaPlaceholder';

/** UC05 Avaliar entrega e registrar feedback. */
export default function EntregasOrientador() {
  return (
    <TelaPlaceholder
      titulo="Entregas pendentes"
      casoDeUso="UC05 Avaliar entrega e registrar feedback"
      descricao="Aqui o orientador lista as entregas pendentes de avaliacao, consulta a versao enviada, baixa o arquivo e registra o parecer (aprovado ou revisar) com comentarios vinculados a versao. Com 'revisar', a etapa volta para 'Em revisao'."
      operacoes={[
        'listarEntregasPendentes(professorId)',
        'consultarVersao(versaoId)',
        'obterArquivo(arquivoId)',
        'registrarParecer(versaoId, parecer, comentarios)',
        'atualizarStatusEtapa(trabalhoId, etapaId, "APROVADA" | "EM_REVISAO")',
        'enviarNotificacao(destinatarioId, tipo, conteudo)',
      ]}
    />
  );
}
