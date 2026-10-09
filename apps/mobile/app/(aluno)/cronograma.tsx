import { TelaPlaceholder } from '../../src/components/TelaPlaceholder';

/** Consulta do cronograma publicado pelo orientador (apoia UC04 e UC06). */
export default function CronogramaAluno() {
  return (
    <TelaPlaceholder
      titulo="Cronograma"
      casoDeUso="UC03 (visao do aluno) / UC04 / UC06"
      descricao="Aqui o aluno consulta as etapas do cronograma publicado pelo orientador, com tipo (parcial ou final), prazo e status de cada uma, e destaca a etapa vigente."
      operacoes={[
        'consultarCronograma(trabalhoId)',
        'consultarEtapaVigente(trabalhoId)',
        'consultarStatusEtapas(trabalhoId)',
        'verificarPrazo(etapaId, dataEnvio)',
      ]}
    />
  );
}
