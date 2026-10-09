import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ErroApi } from '../src/lib/api';
import {
  listarNotificacoes,
  marcarLida,
  ROTULO_TIPO,
  type Notificacao,
} from '../src/lib/notificacoes';
import { useSessao } from '../src/lib/sessao';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; itens: Notificacao[] }
  | { tipo: 'erro'; mensagem: string };

/**
 * Central de notificacoes do usuario atual (UC06 passo 3 e UC07).
 * Lista as notificacoes pendentes; tocar em uma marca como lida na API.
 * Como a listagem da API devolve so as pendentes, um item marcado como lido
 * fica sinalizado na tela e some no proximo refresh.
 */
export default function Notificacoes() {
  const router = useRouter();
  const { usuario } = useSessao();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [atualizando, setAtualizando] = useState(false);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    try {
      const itens = await listarNotificacoes(usuario.id);
      setEstado({ tipo: 'pronto', itens });
    } catch (erro) {
      setEstado({ tipo: 'erro', mensagem: descreverErro(erro) });
    }
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function atualizar() {
    setAtualizando(true);
    setErroAcao(null);
    await carregar();
    setAtualizando(false);
  }

  async function aoTocar(notificacao: Notificacao) {
    if (!usuario || notificacao.lidaEm || marcandoId !== null) return;
    setMarcandoId(notificacao.id);
    setErroAcao(null);
    try {
      const atualizada = await marcarLida(notificacao.id, usuario.id);
      setEstado((atual) =>
        atual.tipo === 'pronto'
          ? { tipo: 'pronto', itens: atual.itens.map((n) => (n.id === atualizada.id ? atualizada : n)) }
          : atual,
      );
    } catch (erro) {
      setErroAcao(descreverErro(erro));
    } finally {
      setMarcandoId(null);
    }
  }

  if (!usuario) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.mensagem}>Nenhum usuario selecionado.</Text>
        <Pressable onPress={() => router.replace('/')} style={estilos.botao}>
          <Text style={estilos.botaoTexto}>Voltar ao inicio</Text>
        </Pressable>
      </View>
    );
  }

  if (estado.tipo === 'carregando') {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.mensagem}>Carregando notificacoes...</Text>
      </View>
    );
  }

  if (estado.tipo === 'erro') {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.mensagemErro}>Nao foi possivel carregar as notificacoes.</Text>
        <Text style={estilos.detalheErro}>{estado.mensagem}</Text>
        <Pressable onPress={() => void atualizar()} style={estilos.botao}>
          <Text style={estilos.botaoTexto}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={estado.itens}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={estado.itens.length === 0 ? estilos.centro : estilos.lista}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => void atualizar()} />}
      ListHeaderComponent={
        <View style={estilos.cabecalho}>
          <Text style={estilos.cabecalhoTexto}>
            {usuario.nome} · {estado.itens.length} pendente{estado.itens.length === 1 ? '' : 's'}
          </Text>
          {erroAcao && <Text style={estilos.detalheErro}>{erroAcao}</Text>}
        </View>
      }
      ListEmptyComponent={
        <Text style={estilos.mensagem}>Nenhuma notificacao pendente. Puxe para atualizar.</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => void aoTocar(item)}
          disabled={item.lidaEm !== null}
          style={({ pressed }) => [
            estilos.item,
            item.lidaEm !== null && estilos.itemLido,
            pressed && estilos.itemPressionado,
          ]}
        >
          <View style={estilos.itemLinha}>
            <Text style={estilos.itemTipo}>{ROTULO_TIPO[item.tipo] ?? item.tipo}</Text>
            <Text style={[estilos.indicador, item.lidaEm !== null && estilos.indicadorLido]}>
              {marcandoId === item.id ? '…' : item.lidaEm !== null ? 'lida' : '● nova'}
            </Text>
          </View>
          <Text style={estilos.itemTitulo}>{item.assunto}</Text>
          <Text style={estilos.itemData}>{formatarData(item.criadaEm)}</Text>
        </Pressable>
      )}
    />
  );
}

function descreverErro(erro: unknown): string {
  if (erro instanceof ErroApi) {
    return erro.status === 0 ? erro.message : `${erro.message} (HTTP ${erro.status})`;
  }
  return erro instanceof Error ? erro.message : String(erro);
}

function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const estilos = StyleSheet.create({
  centro: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  lista: {
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  cabecalho: {
    gap: 4,
    marginBottom: 4,
  },
  cabecalhoTexto: {
    fontSize: 13,
    color: '#666',
  },
  mensagem: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  mensagemErro: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b00020',
    textAlign: 'center',
  },
  detalheErro: {
    fontSize: 13,
    color: '#b00020',
    textAlign: 'center',
  },
  botao: {
    backgroundColor: '#1f6feb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '600',
  },
  item: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    backgroundColor: '#f8fbff',
  },
  itemLido: {
    backgroundColor: '#fff',
    opacity: 0.6,
  },
  itemPressionado: {
    backgroundColor: '#e1e8f0',
  },
  itemLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTipo: {
    fontSize: 12,
    color: '#1f6feb',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indicador: {
    fontSize: 12,
    color: '#1f6feb',
    fontWeight: '600',
  },
  indicadorLido: {
    color: '#888',
    fontWeight: '400',
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemData: {
    fontSize: 12,
    color: '#888',
  },
});
