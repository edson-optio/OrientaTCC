import { TelaPlaceholder } from '../../src/components/TelaPlaceholder';

/** UC12 Gerenciar cadastros e parametros: usuarios. */
export default function Usuarios() {
  return (
    <TelaPlaceholder
      titulo="Usuarios"
      casoDeUso="UC12 Gerenciar cadastros e parametros"
      descricao="Aqui o administrador consulta os usuarios cadastrados, ajusta o perfil (aluno ou professor) e desativa contas quando necessario."
      operacoes={[
        'listarUsuarios(filtros)',
        'atualizarPerfilUsuario(usuarioId, perfil)',
        'desativarUsuario(usuarioId)',
      ]}
    />
  );
}
