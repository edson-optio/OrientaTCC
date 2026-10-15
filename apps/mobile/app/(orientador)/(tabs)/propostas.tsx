import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '../../../src/components/ui/Avatar';
import { Chip } from '../../../src/components/ui/Chip';
import { Cabecalho, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { tempoDecorrido } from '../../../src/lib/datas';
import { STATUS_PROPOSTA, type Proposta } from '../../../src/lib/dominio';
import { LIMITE_ORIENTANDOS, useDemo } from '../../../src/lib/demo';
import { cores, raio } from '../../../src/tema/tokens';

/** Propostas recebidas (UC02): novas primeiro, respondidas abaixo. */
export default function PropostasOrientador() {
  const router = useRouter();
  const { estado, orientandosAtivos } = useDemo();
  const novas = estado.propostasRecebidas.filter((p) => p.status === 'aguardando_orientador');
  const respondidas = estado.propostasRecebidas.filter((p) => p.status !== 'aguardando_orientador');
  const vagas = LIMITE_ORIENTANDOS - orientandosAtivos.length;

  return (
    <Tela comAbas>
      <Cabecalho titulo="Propostas" sobretitulo={`${novas.length} aguardando resposta`} />

      <View style={estilos.vagas} accessible accessibilityLabel={`${orientandosAtivos.length} de ${LIMITE_ORIENTANDOS} vagas ocupadas`}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="corpoForte">
            {vagas > 0 ? `${vagas} ${vagas === 1 ? 'vaga disponível' : 'vagas disponíveis'}` : 'Limite de orientandos atingido'}
          </Texto>
          <Texto variante="legenda">
            {orientandosAtivos.length} de {LIMITE_ORIENTANDOS} orientandos neste semestre
          </Texto>
        </View>
        <View style={estilos.pontos}>
          {Array.from({ length: LIMITE_ORIENTANDOS }, (_, i) => (
            <View key={i} style={[estilos.ponto, i < orientandosAtivos.length && estilos.pontoCheio]} />
          ))}
        </View>
      </View>

      <Secao rotulo="Novas">
        {novas.length === 0 ? (
          <Texto variante="corpo" cor={cores.suave} style={{ paddingVertical: 12 }}>
            Nenhuma proposta nova. Quando um aluno enviar uma proposta para você, ela aparece aqui.
          </Texto>
        ) : (
          novas.map((p, i) => <CartaoProposta key={p.id} proposta={p} ultima={i === novas.length - 1} abrir={() => router.push(`/(orientador)/proposta/${p.id}`)} />)
        )}
      </Secao>

      {respondidas.length > 0 && (
        <Secao rotulo="Respondidas">
          {respondidas.map((p, i) => (
            <CartaoProposta key={p.id} proposta={p} ultima={i === respondidas.length - 1} abrir={() => router.push(`/(orientador)/proposta/${p.id}`)} />
          ))}
        </Secao>
      )}
    </Tela>
  );
}

function CartaoProposta({ proposta, abrir, ultima }: { proposta: Proposta; abrir: () => void; ultima: boolean }) {
  const status = STATUS_PROPOSTA[proposta.status];
  const nova = proposta.status === 'aguardando_orientador';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Proposta de ${proposta.aluno}: ${proposta.tema}. ${status.rotulo}`}
      onPress={abrir}
      style={({ pressed }) => [estilos.cartao, !ultima && estilos.borda, pressed && { opacity: 0.6 }]}
    >
      <View style={estilos.topo}>
        <Avatar nome={proposta.aluno} tamanho={32} />
        <View style={{ flex: 1 }}>
          <Texto variante="corpoForte" style={{ fontSize: 15 }}>
            {proposta.aluno}
          </Texto>
          <Texto variante="legenda" style={{ fontSize: 12 }}>
            {proposta.curso} · {tempoDecorrido(proposta.submetidaEm)}
          </Texto>
        </View>
        {!nova && <Chip pequeno rotulo={status.rotulo} tom={status.tom} />}
      </View>
      <Texto variante="subtitulo" style={!nova && { color: cores.suave }}>
        {proposta.tema}
      </Texto>
      <Texto variante="rotulo" style={{ fontSize: 11 }}>
        {proposta.area}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  vagas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
  },
  pontos: {
    flexDirection: 'row',
    gap: 5,
  },
  ponto: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: cores.linhaForte,
  },
  pontoCheio: {
    backgroundColor: cores.tinta,
    borderColor: cores.tinta,
  },
  cartao: {
    gap: 10,
    paddingVertical: 18,
  },
  borda: {
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
