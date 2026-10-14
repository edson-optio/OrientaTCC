import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { LinhaVersao, Marco, TextoPrazo, tipoMarco } from '../../../src/components/dominio';
import { Botao } from '../../../src/components/ui/Botao';
import { Cabecalho, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { diaMes, prazoRelativo } from '../../../src/lib/datas';
import { STATUS_ENTREGA } from '../../../src/lib/dominio';
import { etapaAtual, useDemo } from '../../../src/lib/demo';
import { cores, raio } from '../../../src/tema/tokens';
import { corDoTom } from '../../../src/components/ui/Chip';

/**
 * Cronograma do aluno (UC06): linha do tempo vertical da proposta aceita ate
 * a conclusao. A etapa atual fica expandida com as versoes e a acao de envio;
 * as demais mostram so nome e prazo.
 */
export default function Cronograma() {
  const router = useRouter();
  const { meuTrabalho } = useDemo();
  const atual = etapaAtual(meuTrabalho);
  const total = meuTrabalho.etapas.length;

  if (!meuTrabalho.cronogramaPublicadoEm) {
    return (
      <Tela comAbas>
        <Cabecalho titulo="Cronograma" sobretitulo="Ainda não publicado" />
        <Texto variante="corpo" cor={cores.suave}>
          Sua orientadora ainda está definindo as etapas e os prazos. Assim que o cronograma for publicado, ele
          aparece aqui.
        </Texto>
      </Tela>
    );
  }

  return (
    <Tela comAbas>
      <Cabecalho
        titulo="Cronograma"
        sobretitulo={`Publicado em ${diaMes(meuTrabalho.cronogramaPublicadoEm)} · ${total} etapas`}
      />

      <View>
        <Marco tipo="feito" linhaCheia>
          <View style={estilos.textos}>
            <Texto variante="corpoForte">Proposta aceita</Texto>
            <Texto variante="legenda">
              {meuTrabalho.orientador} · {diaMes(meuTrabalho.propostaAceitaEm)}
            </Texto>
          </View>
        </Marco>

        {meuTrabalho.etapas.map((etapa, indice) => {
          const status = STATUS_ENTREGA[etapa.status];
          const ehAtual = etapa.id === atual?.id;
          const tipo = tipoMarco(etapa, atual?.id);

          if (!ehAtual) {
            return (
              <Marco key={etapa.id} tipo={tipo} numero={indice + 1} linhaCheia={etapa.status === 'aprovada'}>
                <View style={estilos.linhaFutura}>
                  <View style={[estilos.textos, { flex: 1 }]}>
                    <Texto variante="corpoForte" onPress={() => router.push(`/(aluno)/entrega/${etapa.id}`)}>
                      {etapa.nome}
                    </Texto>
                    <Texto variante="legenda" cor={etapa.status === 'pendente' ? cores.suave : corDoTom(status.tom)}>
                      {etapa.tipo === 'final' ? 'Final' : 'Parcial'} · {status.rotulo.toLowerCase()}
                    </Texto>
                  </View>
                  <View style={estilos.prazo}>
                    <Texto variante="rotulo" cor={cores.tinta} style={{ fontSize: 13 }}>
                      {diaMes(etapa.prazo)}
                    </Texto>
                    {etapa.status !== 'aprovada' && <Texto variante="legenda">{prazoRelativo(etapa.prazo)}</Texto>}
                  </View>
                </View>
              </Marco>
            );
          }

          const versoes = [...etapa.versoes].reverse();
          return (
            <Marco key={etapa.id} tipo={tipo}>
              <View style={estilos.textos}>
                <Texto variante="rotulo" cor={corDoTom(status.tom)} style={{ fontSize: 11 }}>
                  Etapa {indice + 1} de {total} · {status.rotulo}
                </Texto>
                <Texto variante="titulo" style={{ fontSize: 24, lineHeight: 28 }}>
                  {etapa.nome}
                </Texto>
                <TextoPrazo etapa={etapa} />
              </View>
              {versoes.length > 0 && (
                <View style={estilos.versoes}>
                  {versoes.map((v, i) => (
                    <LinhaVersao
                      key={v.id}
                      versao={v}
                      feedback={etapa.feedbacks.find((f) => f.versaoId === v.id)}
                      ultima={i === versoes.length - 1}
                      aoPressionar={() => router.push(`/(aluno)/entrega/${etapa.id}`)}
                    />
                  ))}
                </View>
              )}
              <Botao
                compacto
                icone="enviar"
                rotulo={etapa.versoes.length ? `Enviar versão ${etapa.versoes.length + 1}` : 'Enviar primeira versão'}
                aoPressionar={() => router.push(`/(aluno)/entrega/${etapa.id}`)}
              />
            </Marco>
          );
        })}

        <Marco tipo="meta" ultimo>
          <View style={estilos.textos}>
            <Texto variante="corpoForte" cor={cores.suave}>
              Conclusão do TCC
            </Texto>
            <Texto variante="legenda">Resultado final registrado pela orientadora</Texto>
          </View>
        </Marco>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  textos: {
    gap: 3,
  },
  linhaFutura: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  prazo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  versoes: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    paddingHorizontal: 14,
  },
});
