import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BlocoData, Linha, NumeroGrifado, ProgressoEtapas } from '../../../src/components/dominio';
import { Botao } from '../../../src/components/ui/Botao';
import { Chip } from '../../../src/components/ui/Chip';
import { Cabecalho, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { hojeExtenso, prazoRelativo } from '../../../src/lib/datas';
import { STATUS_ENTREGA, type Etapa } from '../../../src/lib/dominio';
import { etapaAtual, etapasAprovadas, ultimoFeedback, useDemo } from '../../../src/lib/demo';
import { useSessao } from '../../../src/lib/sessao';
import { cores, raio } from '../../../src/tema/tokens';

/**
 * Inicio do aluno (UC06): a proxima acao unica no topo, o progresso do TCC
 * com o unico grifo da tela e os proximos prazos.
 */
export default function InicioAluno() {
  const router = useRouter();
  const { usuario } = useSessao();
  const { meuTrabalho } = useDemo();
  const atual = etapaAtual(meuTrabalho);
  const aprovadas = etapasAprovadas(meuTrabalho);
  const proximas = meuTrabalho.etapas.filter((e) => e.id !== atual?.id && e.status !== 'aprovada');
  const temNovidade = meuTrabalho.etapas.some((e) => e.feedbacks.some((f) => !f.lidoEm));
  const primeiroNome = (usuario?.nome ?? meuTrabalho.aluno).split(' ')[0];

  return (
    <Tela comAbas>
      <Cabecalho
        sobretitulo={`${hojeExtenso()} · ${meuTrabalho.semestre}`}
        titulo={`Olá, ${primeiroNome}.`}
        temNovidade={temNovidade}
      />

      {atual ? (
        <ProximaAcao etapa={atual} abrir={() => router.push(`/(aluno)/entrega/${atual.id}`)} />
      ) : (
        <View style={estilos.acao}>
          <Texto variante="rotulo" cor={cores.tinta}>
            Tudo em dia
          </Texto>
          <Texto variante="titulo">Todas as etapas foram aprovadas.</Texto>
          <Texto variante="corpo" cor={cores.suave}>
            Aguarde o registro do resultado final pela orientadora.
          </Texto>
        </View>
      )}

      <View style={estilos.progresso}>
        <View style={estilos.progressoTopo}>
          <View style={estilos.progressoTextos}>
            <Texto variante="rotulo">Meu TCC</Texto>
            <Texto variante="corpoGrande">{meuTrabalho.titulo}</Texto>
          </View>
          <NumeroGrifado valor={aprovadas} total={meuTrabalho.etapas.length} />
        </View>
        <ProgressoEtapas etapas={meuTrabalho.etapas} />
        <Texto variante="legenda">Etapas aprovadas · orientação com {meuTrabalho.orientador}</Texto>
      </View>

      {proximas.length > 0 && (
        <Secao rotulo="Próximos prazos">
          {proximas.map((etapa, i) => (
            <Linha
              key={etapa.id}
              inicio={<BlocoData iso={etapa.prazo} />}
              titulo={etapa.nome}
              subtitulo={`${etapa.tipo === 'final' ? 'Final' : 'Parcial'} · ${prazoRelativo(etapa.prazo)}`}
              aoPressionar={() => router.push(`/(aluno)/entrega/${etapa.id}`)}
              ultima={i === proximas.length - 1}
            />
          ))}
        </Secao>
      )}
    </Tela>
  );
}

function ProximaAcao({ etapa, abrir }: { etapa: Etapa; abrir: () => void }) {
  const feedback = ultimoFeedback(etapa);
  const proximaVersao = etapa.versoes.length + 1;
  const status = STATUS_ENTREGA[etapa.status];

  let titulo = `Enviar a versão ${proximaVersao} da etapa ${etapa.nome}`;
  let descricao = `Prazo ${prazoRelativo(etapa.prazo)}. Envie o PDF para a avaliação da orientadora.`;
  if (etapa.status === 'em_revisao' && feedback) {
    descricao = `${feedback.autor} pediu revisão: ${feedback.comentarios}`;
  } else if (etapa.status === 'entregue' || etapa.status === 'entregue_com_atraso') {
    titulo = `Versão ${etapa.versoes.length} da etapa ${etapa.nome} em avaliação`;
    descricao = 'Você será avisado quando o parecer for registrado. Pode enviar outra versão se precisar.';
  }

  return (
    <View style={estilos.acao}>
      <View style={estilos.acaoTopo}>
        <Texto variante="rotulo" cor={cores.tinta}>
          Próxima ação
        </Texto>
        <Chip rotulo={status.rotulo} tom={status.tom} />
      </View>
      <View style={{ gap: 8 }}>
        <Texto variante="titulo">{titulo}</Texto>
        <Texto variante="corpo" cor={cores.suave} numberOfLines={3}>
          {descricao}
        </Texto>
      </View>
      <View style={estilos.acaoBotoes}>
        <Botao rotulo="Enviar PDF" icone="enviar" aoPressionar={abrir} estilo={{ flex: 1 }} />
        {feedback && <Botao rotulo="Ler parecer" variante="secundario" aoPressionar={abrir} />}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  acao: {
    gap: 16,
    padding: 20,
    paddingTop: 22,
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
  },
  acaoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  acaoBotoes: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  progresso: {
    gap: 14,
  },
  progressoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  progressoTextos: {
    flex: 1,
    gap: 4,
  },
});
