import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Linha } from '../../../src/components/dominio';
import { Chip, Grifo } from '../../../src/components/ui/Chip';
import { Cabecalho, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { diaMes } from '../../../src/lib/datas';
import { STATUS_ENTREGA } from '../../../src/lib/dominio';
import { useDemo } from '../../../src/lib/demo';
import { cores } from '../../../src/tema/tokens';

/**
 * Entregas do aluno (UC04 e UC06): uma linha por etapa com a situacao da
 * entrega, numero de versoes e pareceres ainda nao lidos.
 */
export default function Entregas() {
  const router = useRouter();
  const { meuTrabalho } = useDemo();
  const totalVersoes = meuTrabalho.etapas.reduce((s, e) => s + e.versoes.length, 0);
  const naoLidos = meuTrabalho.etapas.flatMap((e) => e.feedbacks).filter((f) => !f.lidoEm).length;

  return (
    <Tela comAbas>
      <Cabecalho
        titulo="Entregas"
        sobretitulo={`${totalVersoes} ${totalVersoes === 1 ? 'versão enviada' : 'versões enviadas'}${
          naoLidos ? ` · ${naoLidos} parecer novo` : ''
        }`}
        temNovidade={naoLidos > 0}
      />

      <Secao rotulo="Por etapa">
        {meuTrabalho.etapas.map((etapa, i) => {
          const status = STATUS_ENTREGA[etapa.status];
          const novo = etapa.feedbacks.some((f) => !f.lidoEm);
          return (
            <Linha
              key={etapa.id}
              inicio={
                <View style={estilos.indice}>
                  <Texto variante="rotulo" cor={cores.tinta}>
                    {String(i + 1).padStart(2, '0')}
                  </Texto>
                </View>
              }
              titulo={etapa.nome}
              subtitulo={`${etapa.versoes.length} ${etapa.versoes.length === 1 ? 'versão' : 'versões'} · prazo ${diaMes(etapa.prazo)}`}
              rotuloAcessivel={`${etapa.nome}, ${status.rotulo}${novo ? ', parecer novo' : ''}`}
              fim={
                <View style={estilos.fim}>
                  {novo && <Grifo rotulo="NOVO" />}
                  <Chip pequeno rotulo={status.rotulo} tom={status.tom} />
                </View>
              }
              aoPressionar={() => router.push(`/(aluno)/entrega/${etapa.id}`)}
              ultima={i === meuTrabalho.etapas.length - 1}
            />
          );
        })}
      </Secao>

      <Texto variante="legenda">
        Cada envio cria uma nova versão e preserva as anteriores com seus pareceres. Apenas PDF, até 2 MB.
      </Texto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  indice: {
    width: 28,
    alignItems: 'flex-start',
  },
  fim: {
    alignItems: 'flex-end',
    gap: 6,
  },
});
