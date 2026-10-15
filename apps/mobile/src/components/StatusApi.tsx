import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { apiUrl } from '../lib/api';
import { cores, raio } from '../tema/tokens';
import { Texto } from './ui/Texto';

type EstadoHealth =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; servico: string }
  | { tipo: 'erro'; mensagem: string };

/**
 * Consulta GET /health da API e mostra o resultado em uma linha.
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
        const dados = (await resposta.json()) as { service?: string; status?: string };
        if (!cancelado) {
          setEstado({ tipo: 'ok', servico: dados.service ?? dados.status ?? 'ok' });
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

  const cor = estado.tipo === 'ok' ? cores.aprovada : estado.tipo === 'erro' ? cores.atrasada : cores.suave;

  return (
    <View style={estilos.container} accessibilityLiveRegion="polite">
      {estado.tipo === 'carregando' ? (
        <ActivityIndicator size="small" color={cores.suave} />
      ) : (
        <View style={[estilos.ponto, { backgroundColor: cor }]} />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Texto variante="corpoForte" style={{ fontSize: 15 }}>
          {estado.tipo === 'ok' ? `Conectado · ${estado.servico}` : estado.tipo === 'erro' ? 'Sem conexão' : 'Verificando…'}
        </Texto>
        <Texto variante="legenda" numberOfLines={2}>
          {estado.tipo === 'erro' ? `${apiUrl()} · ${estado.mensagem}` : apiUrl()}
        </Texto>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
  },
  ponto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
