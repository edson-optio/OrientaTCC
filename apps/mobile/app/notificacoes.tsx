import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '../src/components/ui/Botao';
import { Grifo } from '../src/components/ui/Chip';
import { Icone, type NomeIcone } from '../src/components/ui/Icone';
import { BarraNav } from '../src/components/ui/Tela';
import { Texto } from '../src/components/ui/Texto';
import { ErroApi } from '../src/lib/api';
import { tempoDecorrido } from '../src/lib/datas';
import { listarNotificacoes, marcarLida, ROTULO_TIPO, type Notificacao, type TipoNotificacao } from '../src/lib/notificacoes';
import { useSessao } from '../src/lib/sessao';
import { cores, espaco, MARGEM_TELA } from '../src/tema/tokens';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; itens: Notificacao[] }
  | { tipo: 'erro'; mensagem: string };

const ICONE_TIPO: Record<TipoNotificacao, { icone: NomeIcone; cor: string }> = {
  prazo_proximo: { icone: 'relogio', cor: cores.revisao },
  entrega_atrasada: { icone: 'alerta', cor: cores.atrasada },
  feedback_disponivel: { icone: 'revisar', cor: cores.revisar },
  proposta_status: { icone: 'proposta', cor: cores.tinta },
  convite_orientacao: { icone: 'orientandos', cor: cores.tinta },
  convite_banca: { icone: 'orientandos', cor: cores.tinta },
};

/**
 * Central de notificacoes do usuario atual (UC06 passo 3).
 * Lista as notificacoes pendentes da API; tocar em uma marca como lida.
 * Como a listagem devolve so as pendentes, um item lido fica sinalizado e
 * some no proximo refresh.
 */
export default function Notificacoes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const cabecalho = (
    <View style={estilos.cabecalho}>
      <BarraNav />
      <View style={{ gap: 6, paddingTop: espaco[4] }}>
        <Texto variante="rotulo">
          {estado.tipo === 'pronto'
            ? `${estado.itens.filter((n) => !n.lidaEm).length} não lidas`
            : usuario?.nome ?? 'Sem usuário'}
        </Texto>
        <Texto variante="display" accessibilityRole="header">
          Notificações
        </Texto>
      </View>
      {erroAcao && (
        <Texto variante="legenda" cor={cores.atrasada}>
          {erroAcao}
        </Texto>
      )}
    </View>
  );

  if (!usuario) {
    return (
      <View style={[estilos.tela, { paddingTop: insets.top + espaco[2] }]}>
        {cabecalho}
        <View style={estilos.centro}>
          <Texto variante="corpo" cor={cores.suave}>
            Nenhum usuário selecionado.
          </Texto>
          <Botao rotulo="Voltar ao início" aoPressionar={() => router.replace('/')} />
        </View>
      </View>
    );
  }

  return (
    <View style={[estilos.tela, { paddingTop: insets.top + espaco[2] }]}>
      <FlatList
        data={estado.tipo === 'pronto' ? estado.itens : []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[estilos.lista, { paddingBottom: insets.bottom + espaco[6] }]}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => void atualizar()} />}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={
          <View style={estilos.centro}>
            {estado.tipo === 'carregando' && <ActivityIndicator color={cores.suave} />}
            {estado.tipo === 'erro' && (
              <>
                <Texto variante="subtitulo">Não foi possível carregar.</Texto>
                <Texto variante="legenda" style={{ textAlign: 'center' }}>
                  {estado.mensagem}
                </Texto>
                <Botao compacto variante="secundario" rotulo="Tentar de novo" aoPressionar={() => void atualizar()} />
              </>
            )}
            {estado.tipo === 'pronto' && (
              <>
                <Icone nome="check" tamanho={24} cor={cores.aprovada} espessura={2.6} />
                <Texto variante="subtitulo">Tudo em dia.</Texto>
                <Texto variante="legenda">Nenhuma notificação pendente. Puxe para atualizar.</Texto>
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const lida = item.lidaEm !== null;
          const visual = ICONE_TIPO[item.tipo] ?? { icone: 'sino' as const, cor: cores.tinta };
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${ROTULO_TIPO[item.tipo] ?? item.tipo}: ${item.assunto}${lida ? ', lida' : ', não lida'}`}
              onPress={() => void aoTocar(item)}
              disabled={lida}
              style={({ pressed }) => [
                estilos.item,
                index > 0 && estilos.itemBorda,
                lida && { opacity: 0.5 },
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={estilos.iconeItem}>
                <Icone nome={visual.icone} tamanho={18} cor={visual.cor} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={estilos.itemTopo}>
                  <Texto variante="rotulo" style={{ fontSize: 11 }}>
                    {ROTULO_TIPO[item.tipo] ?? item.tipo}
                  </Texto>
                  {marcandoId === item.id ? (
                    <ActivityIndicator size="small" color={cores.suave} />
                  ) : (
                    !lida && <Grifo rotulo="NOVA" />
                  )}
                </View>
                <Texto variante="corpoForte" style={{ fontSize: 15 }}>
                  {item.assunto}
                </Texto>
                <Texto variante="legenda">{tempoDecorrido(item.criadaEm)}</Texto>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function descreverErro(erro: unknown): string {
  if (erro instanceof ErroApi) {
    return erro.status === 0 ? erro.message : `${erro.message} (HTTP ${erro.status})`;
  }
  return erro instanceof Error ? erro.message : String(erro);
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  lista: {
    paddingHorizontal: MARGEM_TELA,
  },
  cabecalho: {
    gap: 8,
    paddingBottom: espaco[4],
  },
  centro: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: espaco[7],
  },
  item: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  itemBorda: {
    borderTopWidth: 1,
    borderTopColor: cores.linha,
  },
  iconeItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
