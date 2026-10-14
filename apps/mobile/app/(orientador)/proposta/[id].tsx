import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../../../src/components/ui/Avatar';
import { Botao } from '../../../src/components/ui/Botao';
import { Campo } from '../../../src/components/ui/Campo';
import { Chip } from '../../../src/components/ui/Chip';
import { Icone } from '../../../src/components/ui/Icone';
import { BarraNav, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { tempoDecorrido } from '../../../src/lib/datas';
import { STATUS_PROPOSTA } from '../../../src/lib/dominio';
import { LIMITE_ORIENTANDOS, useDemo } from '../../../src/lib/demo';
import { cores, raio } from '../../../src/tema/tokens';

type Decisao = 'ajustes' | 'recusada';

/**
 * Responder proposta (UC02): aceitar (bloqueado no limite de orientandos),
 * devolver para ajustes ou recusar, os dois ultimos com justificativa.
 */
export default function DetalheProposta() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado, orientandosAtivos, responderProposta } = useDemo();
  const proposta = estado.propostasRecebidas.find((p) => p.id === Number(id));
  const [decisao, setDecisao] = useState<Decisao | null>(null);
  const [justificativa, setJustificativa] = useState('');

  if (!proposta) {
    return (
      <Tela>
        <BarraNav />
        <Texto variante="titulo">Proposta não encontrada.</Texto>
      </Tela>
    );
  }

  const limiteAtingido = orientandosAtivos.length >= LIMITE_ORIENTANDOS;
  const aberta = proposta.status === 'aguardando_orientador';
  const status = STATUS_PROPOSTA[proposta.status];

  function responder(d: 'aceita' | Decisao) {
    if (!proposta) return;
    responderProposta(proposta.id, d, d === 'aceita' ? undefined : justificativa.trim());
    router.back();
  }

  const rodape = !aberta ? undefined : decisao ? (
    <>
      <Botao
        rotulo={decisao === 'ajustes' ? 'Devolver para ajustes' : 'Recusar proposta'}
        desabilitado={justificativa.trim().length === 0}
        aoPressionar={() => responder(decisao)}
      />
      <Botao rotulo="Cancelar" variante="fantasma" aoPressionar={() => setDecisao(null)} />
    </>
  ) : (
    <>
      {limiteAtingido && (
        <View style={estilos.limite}>
          <Icone nome="alerta" tamanho={16} cor={cores.atrasada} />
          <Texto variante="legenda" cor={cores.atrasada} style={{ flex: 1 }}>
            Limite de {LIMITE_ORIENTANDOS} orientandos atingido. Não é possível aceitar novas propostas.
          </Texto>
        </View>
      )}
      <Botao rotulo="Aceitar orientação" icone="check" desabilitado={limiteAtingido} aoPressionar={() => responder('aceita')} />
      <View style={estilos.linhaBotoes}>
        <Botao rotulo="Pedir ajustes" variante="secundario" compacto estilo={{ flex: 1 }} aoPressionar={() => setDecisao('ajustes')} />
        <Botao rotulo="Recusar" variante="secundario" compacto estilo={{ flex: 1 }} aoPressionar={() => setDecisao('recusada')} />
      </View>
    </>
  );

  return (
    <Tela rodape={rodape}>
      <BarraNav titulo="Proposta de tema" />

      <View style={{ gap: 14 }}>
        <View style={estilos.aluno}>
          <Avatar nome={proposta.aluno} tamanho={44} />
          <View style={{ flex: 1 }}>
            <Texto variante="corpoForte">{proposta.aluno}</Texto>
            <Texto variante="legenda">
              {proposta.curso} · enviada {tempoDecorrido(proposta.submetidaEm)}
            </Texto>
          </View>
        </View>
        <Texto variante="display" accessibilityRole="header">
          {proposta.tema}
        </Texto>
        {!aberta && <Chip rotulo={status.rotulo} tom={status.tom} />}
      </View>

      <Secao rotulo="Área">
        <Texto variante="corpo">{proposta.area}</Texto>
      </Secao>
      <Secao rotulo="Resumo">
        <Texto variante="corpo">{proposta.resumo}</Texto>
      </Secao>
      <Secao rotulo="Objetivos">
        <Texto variante="corpo">{proposta.objetivos}</Texto>
      </Secao>

      {proposta.justificativa && (
        <Secao rotulo="Sua justificativa">
          <Texto variante="citacao">“{proposta.justificativa}”</Texto>
        </Secao>
      )}

      {decisao && (
        <Campo
          rotulo={decisao === 'ajustes' ? 'O que o aluno precisa ajustar?' : 'Motivo da recusa'}
          valor={justificativa}
          aoMudar={setJustificativa}
          multilinha
          ajuda="Obrigatório. O aluno verá esta justificativa."
        />
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  aluno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 8,
  },
  limite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: raio.sm,
    backgroundColor: cores.atrasadaFundo,
  },
});
