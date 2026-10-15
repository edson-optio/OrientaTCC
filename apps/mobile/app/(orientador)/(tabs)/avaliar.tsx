import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Linha } from '../../../src/components/dominio';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Chip } from '../../../src/components/ui/Chip';
import { Icone } from '../../../src/components/ui/Icone';
import { Cabecalho, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { hojeExtenso, prazoRelativo, saudacao, tempoDecorrido } from '../../../src/lib/datas';
import { aguardandoParecer, diasParado, LIMITE_ORIENTANDOS, useDemo } from '../../../src/lib/demo';
import { useSessao } from '../../../src/lib/sessao';
import { cores, fontes, raio } from '../../../src/tema/tokens';

/**
 * Inicio do orientador: contadores acionaveis no topo e a fila de versoes
 * aguardando parecer (UC05). Entregas atrasadas e orientandos parados vem
 * logo abaixo (UC08).
 */
export default function InicioOrientador() {
  const router = useRouter();
  const { usuario } = useSessao();
  const { orientandosAtivos, estado } = useDemo();

  const fila = orientandosAtivos
    .flatMap((t) => t.etapas.filter(aguardandoParecer).map((etapa) => ({ trabalho: t, etapa })))
    .sort((a, b) => (a.etapa.versoes.at(-1)!.enviadaEm < b.etapa.versoes.at(-1)!.enviadaEm ? -1 : 1));
  const atrasadas = orientandosAtivos.flatMap((t) =>
    t.etapas.filter((e) => e.status === 'atrasada').map((etapa) => ({ trabalho: t, etapa })),
  );
  const propostasNovas = estado.propostasRecebidas.filter((p) => p.status === 'aguardando_orientador').length;
  const parados = orientandosAtivos.filter((t) => diasParado(t) >= 14).length;
  const sobrenome = (usuario?.nome ?? 'Profa. Ana Souza').split(' ').slice(0, 2).join(' ');

  return (
    <Tela comAbas>
      <Cabecalho sobretitulo={hojeExtenso()} titulo={`${saudacao()}, ${sobrenome}.`} temNovidade={propostasNovas > 0} />

      <View style={estilos.contadores}>
        <Contador
          valor={fila.length}
          rotulo={fila.length === 1 ? 'versão para avaliar' : 'versões para avaliar'}
          destaque
        />
        <Contador
          valor={propostasNovas}
          rotulo={propostasNovas === 1 ? 'proposta nova' : 'propostas novas'}
          aoPressionar={() => router.push('/(orientador)/(tabs)/propostas')}
        />
        <Contador
          valor={orientandosAtivos.length}
          total={LIMITE_ORIENTANDOS}
          rotulo="vagas ocupadas"
          aoPressionar={() => router.push('/(orientador)/(tabs)/orientandos')}
        />
      </View>

      <Secao rotulo="Para avaliar">
        {fila.length === 0 ? (
          <View style={estilos.vazio}>
            <Icone nome="check" tamanho={22} cor={cores.aprovada} espessura={2.6} />
            <Texto variante="subtitulo">Tudo avaliado.</Texto>
            <Texto variante="corpo" cor={cores.suave}>
              Nenhuma versão aguardando parecer. As novas entregas aparecem aqui.
            </Texto>
          </View>
        ) : (
          fila.map(({ trabalho, etapa }, i) => {
            const v = etapa.versoes.at(-1)!;
            const anterior = etapa.feedbacks.length > 0;
            return (
              <Pressable
                key={etapa.id}
                accessibilityRole="button"
                accessibilityLabel={`${trabalho.aluno}, ${etapa.nome}, versão ${v.numero}, enviada ${tempoDecorrido(v.enviadaEm)}`}
                onPress={() => router.push(`/(orientador)/avaliacao/${etapa.id}?trabalho=${trabalho.id}`)}
                style={({ pressed }) => [estilos.item, i < fila.length - 1 && estilos.itemBorda, pressed && { opacity: 0.6 }]}
              >
                <Avatar nome={trabalho.aluno} tamanho={44} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={estilos.itemTopo}>
                    <Texto variante="corpoForte">{trabalho.aluno}</Texto>
                    <Texto variante="legenda">{tempoDecorrido(v.enviadaEm)}</Texto>
                  </View>
                  <Texto variante="corpo" numberOfLines={1}>
                    {etapa.nome} · <Texto variante="corpo" style={{ fontFamily: fontes.monoForte, fontSize: 14 }}>v{v.numero}</Texto>
                  </Texto>
                  <Texto variante="legenda">
                    {anterior ? `Você pediu revisão na v${v.numero - 1}` : 'Primeira versão'} · prazo {prazoRelativo(etapa.prazo)}
                  </Texto>
                </View>
              </Pressable>
            );
          })
        )}
      </Secao>

      {(atrasadas.length > 0 || parados > 0) && (
        <Secao rotulo="Atenção">
          {atrasadas.map(({ trabalho, etapa }, i) => (
            <Linha
              key={etapa.id}
              inicio={<Avatar nome={trabalho.aluno} tamanho={36} />}
              titulo={trabalho.aluno}
              subtitulo={`${etapa.nome} · ${prazoRelativo(etapa.prazo)} sem entrega`}
              fim={<Chip pequeno rotulo="Atrasada" tom="atrasada" />}
              aoPressionar={() => router.push(`/(orientador)/trabalho/${trabalho.id}`)}
              ultima={i === atrasadas.length - 1}
            />
          ))}
        </Secao>
      )}
    </Tela>
  );
}

function Contador({
  valor,
  total,
  rotulo,
  destaque,
  aoPressionar,
}: {
  valor: number;
  total?: number;
  rotulo: string;
  destaque?: boolean;
  aoPressionar?: () => void;
}) {
  return (
    <Pressable
      disabled={!aoPressionar}
      onPress={aoPressionar}
      accessibilityRole={aoPressionar ? 'button' : 'text'}
      accessibilityLabel={`${valor}${total ? ` de ${total}` : ''} ${rotulo}`}
      style={({ pressed }) => [estilos.contador, destaque && estilos.contadorDestaque, pressed && { opacity: 0.7 }]}
    >
      <View style={estilos.contadorNumero}>
        <Texto style={estilos.numero}>{valor}</Texto>
        {total !== undefined && <Texto style={estilos.numeroTotal}>/{total}</Texto>}
      </View>
      <Texto variante="legenda" cor={cores.tinta} style={{ fontSize: 12, lineHeight: 15 }}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contadores: {
    flexDirection: 'row',
    gap: 8,
  },
  contador: {
    flex: 1,
    padding: 14,
    paddingTop: 10,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    gap: 4,
  },
  contadorDestaque: {
    backgroundColor: cores.grifo,
  },
  contadorNumero: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  numero: {
    fontFamily: fontes.display,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
    color: cores.tinta,
  },
  numeroTotal: {
    fontFamily: fontes.displayLeve,
    fontSize: 18,
    color: cores.tinta,
  },
  item: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  itemBorda: {
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  itemTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  vazio: {
    gap: 8,
    padding: 20,
    borderRadius: raio.lg,
    backgroundColor: cores.aprovadaFundo,
  },
});
