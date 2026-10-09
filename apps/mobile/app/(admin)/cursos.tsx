import { TelaPlaceholder } from '../../src/components/TelaPlaceholder';

/** UC12 Gerenciar cadastros e parametros: cursos e semestres letivos. */
export default function Cursos() {
  return (
    <TelaPlaceholder
      titulo="Cursos e semestres"
      casoDeUso="UC12 Gerenciar cadastros e parametros"
      descricao="Aqui o administrador cadastra os cursos e os semestres letivos usados nos cadastros de alunos e professores."
      operacoes={['cadastrarCurso(dadosCurso)', 'cadastrarSemestre(dadosSemestre)']}
    />
  );
}
