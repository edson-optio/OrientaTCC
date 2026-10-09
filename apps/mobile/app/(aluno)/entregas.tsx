import { TelaPlaceholder } from '../../src/components/TelaPlaceholder';

/** UC04 Submeter entrega. */
export default function EntregasAluno() {
  return (
    <TelaPlaceholder
      titulo="Entregas"
      casoDeUso="UC04 Submeter entrega"
      descricao="Aqui o aluno seleciona a etapa vigente, anexa o arquivo e envia a entrega. Cada envio gera uma nova versao e preserva as anteriores; apos o prazo a etapa fica 'Entregue com atraso'."
      operacoes={[
        'consultarCronograma(trabalhoId)',
        'consultarEtapaVigente(trabalhoId)',
        'armazenarArquivo(arquivo)',
        'submeterEntrega(trabalhoId, etapaId, arquivoId)',
        'verificarPrazo(etapaId, dataEnvio)',
        'atualizarStatusEtapa(trabalhoId, etapaId, "ENTREGUE" | "ENTREGUE_COM_ATRASO")',
        'listarVersoes(entregaId)',
        'enviarNotificacao(destinatarioId, tipo, conteudo)',
      ]}
    />
  );
}
