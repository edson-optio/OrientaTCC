import { TelaPlaceholder } from '../../src/components/TelaPlaceholder';

/** UC12 Gerenciar cadastros e parametros: parametros do sistema. */
export default function Parametros() {
  return (
    <TelaPlaceholder
      titulo="Parametros"
      casoDeUso="UC12 Gerenciar cadastros e parametros"
      descricao="Aqui o administrador define os parametros do sistema, como o limite de orientandos por professor e o dominio de e-mail institucional. Valores invalidos (ex.: limite menor que 1) sao rejeitados."
      operacoes={['obterParametro(chave)', 'definirParametro(chave, valor)']}
    />
  );
}
