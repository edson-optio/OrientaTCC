import { TelaPlaceholder } from '../../src/components/TelaPlaceholder';

/** UC06 Consultar feedback e andamento. */
export default function MeuTrabalho() {
  return (
    <TelaPlaceholder
      titulo="Meu trabalho"
      casoDeUso="UC06 Consultar feedback e andamento"
      descricao="Aqui o aluno ve o status do trabalho, o status e os prazos de cada etapa e os feedbacks do orientador por versao. Ao abrir um feedback, ele e marcado como lido. Sem feedback, aparecem apenas o cronograma e o status das etapas."
      operacoes={[
        'consultarTrabalho(trabalhoId)',
        'consultarStatusEtapas(trabalhoId)',
        'consultarFeedback(trabalhoId)',
        'marcarFeedbackLido(feedbackId)',
      ]}
    />
  );
}
