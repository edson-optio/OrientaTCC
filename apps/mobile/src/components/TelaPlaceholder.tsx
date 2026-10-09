import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  /** Titulo exibido na tela. */
  titulo: string;
  /** Caso de uso coberto (ex.: "UC01 Submeter proposta de tema"). */
  casoDeUso?: string;
  /** Uma frase explicando o que a tela fara quando for implementada. */
  descricao: string;
  /**
   * Operacoes identificadas na secao 2 do documento de modelagem para o caso
   * de uso desta tela. Servem de guia para a implementacao.
   */
  operacoes?: string[];
  /** Conteudo extra (formularios ou listas provisorias). */
  children?: ReactNode;
};

/**
 * Tela provisoria usada enquanto as funcionalidades nao sao implementadas.
 * Mostra o titulo, o caso de uso, a descricao e a lista de operacoes.
 */
export function TelaPlaceholder({ titulo, casoDeUso, descricao, operacoes, children }: Props) {
  return (
    <ScrollView contentContainerStyle={estilos.container}>
      <Text style={estilos.titulo}>{titulo}</Text>
      {casoDeUso && <Text style={estilos.casoDeUso}>{casoDeUso}</Text>}
      <Text style={estilos.descricao}>{descricao}</Text>

      {children}

      {operacoes && operacoes.length > 0 && (
        <View style={estilos.bloco}>
          <Text style={estilos.rotuloBloco}>Operacoes (secao 2 da modelagem)</Text>
          {operacoes.map((operacao) => (
            <Text key={operacao} style={estilos.operacao}>
              {'•'} {operacao}
            </Text>
          ))}
        </View>
      )}

      <Text style={estilos.aviso}>Em construcao</Text>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    gap: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  casoDeUso: {
    fontSize: 13,
    color: '#1f6feb',
    fontWeight: '600',
    marginTop: -8,
  },
  descricao: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
  },
  bloco: {
    backgroundColor: '#f2f5f9',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  rotuloBloco: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  operacao: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#222',
  },
  aviso: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
