import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { cores, fontes, raio } from '../tema/tokens';
import { Grifo } from './ui/Chip';
import { Cabecalho, Secao, Tela } from './ui/Tela';
import { Texto } from './ui/Texto';

type Props = {
  /** Titulo exibido na tela. */
  titulo: string;
  /** Caso de uso coberto (ex.: "UC01 Submeter proposta de tema"). */
  casoDeUso?: string;
  /** Uma frase explicando o que a tela fara quando for implementada. */
  descricao: string;
  /** Operacoes da modelagem para o caso de uso desta tela. */
  operacoes?: string[];
  /** Conteudo extra (formularios ou listas provisorias). */
  children?: ReactNode;
};

/**
 * Tela provisoria (perfil admin) no novo design: titulo editorial, descricao
 * e as operacoes previstas, marcada com o grifo "EM CONSTRUÇÃO".
 */
export function TelaPlaceholder({ titulo, casoDeUso, descricao, operacoes, children }: Props) {
  return (
    <Tela comAbas>
      <Cabecalho titulo={titulo} sobretitulo={casoDeUso} />
      <View style={{ gap: 12, alignItems: 'flex-start' }}>
        <Grifo rotulo="EM CONSTRUÇÃO" />
        <Texto variante="corpo" cor={cores.suave} style={{ fontSize: 16, lineHeight: 24 }}>
          {descricao}
        </Texto>
      </View>

      {children}

      {operacoes && operacoes.length > 0 && (
        <Secao rotulo="Operações previstas">
          <View style={estilos.bloco}>
            {operacoes.map((operacao) => (
              <Texto key={operacao} style={estilos.operacao}>
                {operacao}
              </Texto>
            ))}
          </View>
        </Secao>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    padding: 16,
    gap: 8,
  },
  operacao: {
    fontFamily: fontes.mono,
    fontSize: 13,
    lineHeight: 18,
    color: cores.tinta,
  },
});
