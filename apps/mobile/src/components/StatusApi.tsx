import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { apiUrl } from '../lib/api';

type EstadoHealth =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; dados: unknown }
  | { tipo: 'erro'; mensagem: string };

/**
 * Consulta GET /health da API e mostra o resultado.
 * Serve para confirmar, durante o desenvolvimento, que o app enxerga a API.
 */
export function StatusApi() {
  const [estado, setEstado] = useState<EstadoHealth>({ tipo: 'carregando' });

  useEffect(() => {
    let cancelado = false;

    async function verificarHealth() {
      try {
        const resposta = await fetch(`${apiUrl()}/health`);
        if (!resposta.ok) {
          throw new Error(`HTTP ${resposta.status}`);
        }
        const dados: unknown = await resposta.json();
        if (!cancelado) {
          setEstado({ tipo: 'ok', dados });
        }
      } catch (erro) {
        if (!cancelado) {
          const mensagem = erro instanceof Error ? erro.message : String(erro);
          setEstado({ tipo: 'erro', mensagem });
        }
      }
    }

    void verificarHealth();

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <View style={estilos.container}>
      <Text style={estilos.url}>API: {apiUrl()}</Text>

      {estado.tipo === 'carregando' && <ActivityIndicator />}
      {estado.tipo === 'ok' && (
        <Text style={estilos.status}>{JSON.stringify(estado.dados, null, 2)}</Text>
      )}
      {estado.tipo === 'erro' && (
        <Text style={[estilos.status, estilos.erro]}>Erro: {estado.mensagem}</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  url: {
    fontSize: 13,
    color: '#666',
  },
  status: {
    fontFamily: 'monospace',
    fontSize: 13,
    textAlign: 'center',
  },
  erro: {
    color: '#b00020',
  },
});
