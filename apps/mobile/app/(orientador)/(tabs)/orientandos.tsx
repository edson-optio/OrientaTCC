import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressoEtapas } from '../../../src/components/dominio';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Chip } from '../../../src/components/ui/Chip';
import { Cabecalho, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { prazoRelativo } from '../../../src/lib/datas';
import { STATUS_ENTREGA, type Trabalho } from '../../../src/lib/dominio';
import { diasParado, etapaAtual, etapasAprovadas, LIMITE_ORIENTANDOS, useDemo } from '../../../src/lib/demo';
import { cores } from '../../../src/tema/tokens';

/**
 * Painel de orientandos (UC08): para cada trabalho, etapa vigente, situacao,
 * progresso por etapa e alerta de "parado ha X dias".
 */
export default function Orientandos() {
  const router = useRouter();
  const { orientandosAtivos } = useDemo();

  return (
    <Tela comAbas>
      <Cabecalho titulo="Orientandos" sobretitulo={`${orientandosAtivos.length} de ${LIMITE_ORIENTANDOS} vagas · 2026.2`} />

      <Secao rotulo="Em orientação">
        {orientandosAtivos.length === 0 ? (
          <Texto variante="corpo" cor={cores.suave} style={{ paddingVertical: 12 }}>
            Você ainda não tem orientandos. Ao aceitar uma proposta, o trabalho aparece aqui.
          </Texto>
        ) : (
          orientandosAtivos.map((t, i) => (
            <CartaoOrientando
              key={t.id}
              trabalho={t}
              ultimo={i === orientandosAtivos.length - 1}
              abrir={() => router.push(`/(orientador)/trabalho/${t.id}`)}
            />
          ))
        )}
      </Secao>
    </Tela>
  );
}

function CartaoOrientando({ trabalho, abrir, ultimo }: { trabalho: Trabalho; abrir: () => void; ultimo: boolean }) {
  const atual = etapaAtual(trabalho);
  const parado = diasParado(trabalho);
  const status = atual ? STATUS_ENTREGA[atual.status] : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trabalho.aluno}. ${trabalho.titulo}. ${etapasAprovadas(trabalho)} de ${trabalho.etapas.length} etapas aprovadas`}
      onPress={abrir}
      style={({ pressed }) => [estilos.cartao, !ultimo && estilos.borda, pressed && { opacity: 0.6 }]}
    >
      <View style={estilos.topo}>
        <Avatar nome={trabalho.aluno} tamanho={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="corpoForte">{trabalho.aluno}</Texto>
          <Texto variante="legenda" numberOfLines={1}>
            {trabalho.titulo}
          </Texto>
        </View>
        <Texto variante="rotulo" cor={cores.tinta}>
          {etapasAprovadas(trabalho)}/{trabalho.etapas.length || '–'}
        </Texto>
      </View>

      {trabalho.etapas.length > 0 ? <ProgressoEtapas etapas={trabalho.etapas} /> : null}

      <View style={estilos.rodape}>
        {atual && status ? (
          <>
            <Texto variante="legenda" style={{ flex: 1 }} numberOfLines={1}>
              {atual.nome} · {prazoRelativo(atual.prazo)}
            </Texto>
            <Chip pequeno rotulo={status.rotulo} tom={status.tom} />
          </>
        ) : (
          <Texto variante="legenda" cor={cores.revisar}>
            Cronograma ainda não definido
          </Texto>
        )}
      </View>
      {parado >= 14 && (
        <Texto variante="legenda" cor={cores.atrasada}>
          Sem atividade há {parado} dias
        </Texto>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    gap: 14,
    paddingVertical: 18,
  },
  borda: {
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
