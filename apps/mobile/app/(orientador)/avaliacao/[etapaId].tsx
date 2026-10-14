import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CartaParecer, LinhaVersao } from '../../../src/components/dominio';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Botao } from '../../../src/components/ui/Botao';
import { Campo } from '../../../src/components/ui/Campo';
import { corDoTom } from '../../../src/components/ui/Chip';
import { Icone, type NomeIcone } from '../../../src/components/ui/Icone';
import { BarraNav, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { diaMes, prazoRelativo, tempoDecorrido } from '../../../src/lib/datas';
import type { Parecer } from '../../../src/lib/dominio';
import { aguardandoParecer, useDemo } from '../../../src/lib/demo';
import { cores, fontes, raio } from '../../../src/tema/tokens';

/**
 * Avaliar entrega (UC05). Mostra a versao enviada, o parecer anterior (se
 * houver) e, no rodape, a escolha binaria explicita Aprovar / Pedir revisao
 * com comentario obrigatorio. Uma versao so pode ser avaliada uma vez.
 */
export default function Avaliacao() {
  const router = useRouter();
  const { etapaId, trabalho: trabalhoId } = useLocalSearchParams<{ etapaId: string; trabalho: string }>();
  const { estado, registrarParecer } = useDemo();
  const trabalho = estado.trabalhos.find((t) => t.id === Number(trabalhoId));
  const etapa = trabalho?.etapas.find((e) => e.id === Number(etapaId));

  const [parecer, setParecer] = useState<Parecer | null>(null);
  const [comentarios, setComentarios] = useState('');

  if (!trabalho || !etapa) {
    return (
      <Tela>
        <BarraNav />
        <Texto variante="titulo">Entrega não encontrada.</Texto>
      </Tela>
    );
  }

  const versao = etapa.versoes.at(-1);
  const pendente = aguardandoParecer(etapa);
  const anterior = etapa.feedbacks.at(-1);
  const ordem = trabalho.etapas.findIndex((e) => e.id === etapa.id) + 1;
  const podeEnviar = parecer !== null && comentarios.trim().length > 0;

  function enviar() {
    if (!parecer || !trabalho || !etapa) return;
    registrarParecer(trabalho.id, etapa.id, parecer, comentarios.trim());
    router.back();
  }

  const rodape = pendente ? (
    <>
      <View style={estilos.escolhas} accessibilityRole="radiogroup">
        <Escolha
          rotulo="Aprovar"
          icone="check"
          tom="aprovada"
          selecionada={parecer === 'aprovado'}
          aoPressionar={() => setParecer('aprovado')}
        />
        <Escolha
          rotulo="Pedir revisão"
          icone="revisar"
          tom="revisar"
          selecionada={parecer === 'revisar'}
          aoPressionar={() => setParecer('revisar')}
        />
      </View>
      <Botao
        rotulo={parecer === 'aprovado' ? 'Registrar aprovação' : parecer === 'revisar' ? 'Enviar pedido de revisão' : 'Escolha um parecer'}
        desabilitado={!podeEnviar}
        aoPressionar={enviar}
      />
    </>
  ) : undefined;

  return (
    <Tela rodape={rodape}>
      <BarraNav titulo={`Etapa ${ordem} de ${trabalho.etapas.length}`} />

      <View style={{ gap: 12 }}>
        <View style={estilos.aluno}>
          <Avatar nome={trabalho.aluno} tamanho={32} />
          <Texto variante="legenda" cor={cores.tinta} style={{ fontFamily: fontes.sansMedio }}>
            {trabalho.aluno}
          </Texto>
        </View>
        <Texto variante="display" accessibilityRole="header">
          {etapa.nome}
        </Texto>
        <Texto variante="legenda">
          Prazo {diaMes(etapa.prazo)} ({prazoRelativo(etapa.prazo)}) · {trabalho.titulo}
        </Texto>
      </View>

      {versao && (
        <View style={estilos.documento}>
          <View style={estilos.folha}>
            <Texto style={estilos.folhaVersao}>v{versao.numero}</Texto>
            <View style={estilos.folhaLinhas}>
              {[86, 100, 92, 70, 100, 58].map((w, i) => (
                <View key={i} style={[estilos.folhaLinha, { width: `${w}%` }]} />
              ))}
            </View>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Texto variante="corpoForte" numberOfLines={2}>
              {versao.nome}
            </Texto>
            <Texto variante="legenda">
              Enviada {tempoDecorrido(versao.enviadaEm)}
              {versao.comAtraso ? ' · com atraso' : ''}
            </Texto>
            <Botao compacto variante="secundario" icone="baixar" rotulo="Abrir PDF" estilo={{ alignSelf: 'flex-start', marginTop: 6 }} />
          </View>
        </View>
      )}

      {pendente ? (
        <Campo
          rotulo="Comentários para o aluno"
          valor={comentarios}
          aoMudar={setComentarios}
          multilinha
          dica={
            anterior
              ? 'O que melhorou desde a versão anterior? O que ainda falta?'
              : 'Pontos fortes, o que revisar e sugestões de leitura.'
          }
          ajuda="Obrigatório. O aluno recebe o parecer assim que você enviar."
        />
      ) : (
        <View style={estilos.avaliada}>
          <Icone nome="check" tamanho={18} cor={cores.aprovada} espessura={2.6} />
          <Texto variante="corpo" style={{ flex: 1 }}>
            Esta versão já foi avaliada. Uma nova avaliação só é possível quando o aluno enviar outra versão.
          </Texto>
        </View>
      )}

      {anterior && (
        <Secao rotulo={pendente ? 'Seu parecer anterior' : 'Parecer registrado'}>
          <CartaParecer
            feedback={anterior}
            numeroVersao={etapa.versoes.find((v) => v.id === anterior.versaoId)?.numero ?? 1}
          />
        </Secao>
      )}

      {etapa.versoes.length > 1 && (
        <Secao rotulo="Histórico de versões">
          {[...etapa.versoes].reverse().map((v, i, lista) => (
            <LinhaVersao
              key={v.id}
              versao={v}
              feedback={etapa.feedbacks.find((f) => f.versaoId === v.id)}
              ultima={i === lista.length - 1}
            />
          ))}
        </Secao>
      )}
    </Tela>
  );
}

function Escolha({
  rotulo,
  icone,
  tom,
  selecionada,
  aoPressionar,
}: {
  rotulo: string;
  icone: NomeIcone;
  tom: 'aprovada' | 'revisar';
  selecionada: boolean;
  aoPressionar: () => void;
}) {
  const cor = corDoTom(tom);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionada }}
      accessibilityLabel={rotulo}
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilos.escolha,
        selecionada && { borderColor: cor, backgroundColor: tom === 'aprovada' ? cores.aprovadaFundo : cores.revisarFundo },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Icone nome={icone} tamanho={18} cor={selecionada ? cor : cores.tinta} espessura={2.4} />
      <Texto variante="corpoForte" cor={selecionada ? cor : cores.tinta} style={{ fontSize: 15 }}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  aluno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documento: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
  },
  folha: {
    width: 84,
    height: 110,
    borderRadius: 6,
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  folhaVersao: {
    fontFamily: fontes.monoForte,
    fontSize: 11,
    color: cores.tinta,
    backgroundColor: cores.grifo,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  folhaLinhas: {
    gap: 6,
  },
  folhaLinha: {
    height: 4,
    borderRadius: 2,
    backgroundColor: cores.linha,
  },
  avaliada: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: raio.md,
    backgroundColor: cores.aprovadaFundo,
  },
  escolhas: {
    flexDirection: 'row',
    gap: 8,
  },
  escolha: {
    flex: 1,
    minHeight: 50,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: cores.linha,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
