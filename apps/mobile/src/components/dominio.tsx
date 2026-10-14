/**
 * Componentes do dominio do OrientaTCC construidos sobre o design system:
 * linha do tempo de etapas, carta de parecer, linha de versao, bloco de data
 * e barra de progresso segmentada.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { diaMes, partesData, prazoRelativo, tempoDecorrido } from '../lib/datas';
import { PARECER, STATUS_ENTREGA, type Etapa, type Feedback, type Versao } from '../lib/dominio';
import { cores, fontes, raio } from '../tema/tokens';
import { Avatar } from './ui/Avatar';
import { Chip, corDoTom, Grifo } from './ui/Chip';
import { Icone } from './ui/Icone';
import { Texto } from './ui/Texto';

/* ---------- Progresso segmentado ---------- */

export function ProgressoEtapas({ etapas }: { etapas: Etapa[] }) {
  return (
    <View
      style={estilos.segmentos}
      accessibilityRole="progressbar"
      accessibilityLabel={`${etapas.filter((e) => e.status === 'aprovada').length} de ${etapas.length} etapas aprovadas`}
    >
      {etapas.map((e) => {
        const tom = STATUS_ENTREGA[e.status].tom;
        return (
          <View
            key={e.id}
            style={[estilos.segmento, { backgroundColor: tom === 'neutro' ? cores.linha : corDoTom(tom) }]}
          />
        );
      })}
    </View>
  );
}

/** Numero grande grifado: "1/3". */
export function NumeroGrifado({ valor, total }: { valor: number; total: number }) {
  return (
    <View style={estilos.numeroGrifado}>
      <Texto style={estilos.numeroGrande}>{valor}</Texto>
      <Texto style={estilos.numeroTotal}>/{total}</Texto>
    </View>
  );
}

/* ---------- Bloco de data (13 / NOV) ---------- */

export function BlocoData({ iso, destaque }: { iso: string; destaque?: boolean }) {
  const { dia, mes } = partesData(iso);
  return (
    <View style={estilos.blocoData}>
      <Texto style={[estilos.blocoDia, destaque && { color: cores.atrasada }]}>{dia}</Texto>
      <Texto variante="rotulo" style={estilos.blocoMes}>
        {mes}
      </Texto>
    </View>
  );
}

/* ---------- Linha de lista generica ---------- */

type LinhaProps = {
  inicio?: ReactNode;
  titulo: string;
  subtitulo?: string;
  fim?: ReactNode;
  aoPressionar?: () => void;
  ultima?: boolean;
  rotuloAcessivel?: string;
};

export function Linha({ inicio, titulo, subtitulo, fim, aoPressionar, ultima, rotuloAcessivel }: LinhaProps) {
  return (
    <Pressable
      disabled={!aoPressionar}
      onPress={aoPressionar}
      accessibilityRole={aoPressionar ? 'button' : undefined}
      accessibilityLabel={rotuloAcessivel}
      style={({ pressed }) => [estilos.linha, !ultima && estilos.linhaBorda, pressed && estilos.pressionado]}
    >
      {inicio}
      <View style={estilos.linhaTextos}>
        <Texto variante="corpoForte" numberOfLines={2}>
          {titulo}
        </Texto>
        {subtitulo && <Texto variante="legenda">{subtitulo}</Texto>}
      </View>
      {fim ?? (aoPressionar ? <Icone nome="avancar" tamanho={18} cor="#8A8A8A" /> : null)}
    </Pressable>
  );
}

/* ---------- Linha do tempo de etapas ---------- */

type MarcoProps = {
  tipo: 'feito' | 'atual' | 'futuro' | 'meta' | 'atrasado';
  numero?: number;
  ultimo?: boolean;
  linhaCheia?: boolean;
  children: ReactNode;
};

/** Um no da linha do tempo: trilho a esquerda e conteudo livre a direita. */
export function Marco({ tipo, numero, ultimo, linhaCheia, children }: MarcoProps) {
  return (
    <View style={estilos.marco}>
      <View style={estilos.trilho}>
        <View style={[estilos.no, estilosNo[tipo]]}>
          {tipo === 'feito' && <Icone nome="check" tamanho={14} cor="#FFFFFF" espessura={3} />}
          {tipo === 'atual' && <Icone nome="revisar" tamanho={13} espessura={3} />}
          {tipo === 'atrasado' && <Icone nome="alerta" tamanho={13} cor="#FFFFFF" espessura={2.6} />}
          {tipo === 'meta' && <Icone nome="bandeira" tamanho={13} cor="#8A8A8A" espessura={2.4} />}
          {tipo === 'futuro' && <Texto style={estilos.noNumero}>{numero}</Texto>}
        </View>
        {!ultimo && <View style={[estilos.trilhoLinha, linhaCheia && { backgroundColor: cores.aprovada }]} />}
      </View>
      <View style={[estilos.marcoConteudo, ultimo && { paddingBottom: 0 }]}>{children}</View>
    </View>
  );
}

const estilosNo = StyleSheet.create({
  feito: { backgroundColor: cores.aprovada },
  atual: { backgroundColor: cores.grifo, borderWidth: 2, borderColor: cores.tinta },
  atrasado: { backgroundColor: cores.atrasada },
  futuro: { backgroundColor: cores.fundo, borderWidth: 2, borderColor: cores.linhaForte },
  meta: { backgroundColor: cores.fundo, borderWidth: 2, borderColor: cores.linhaForte, borderStyle: 'dashed' },
});

/** Tipo de marco para uma etapa, considerando qual e a etapa atual. */
export function tipoMarco(etapa: Etapa, atualId?: number): MarcoProps['tipo'] {
  if (etapa.status === 'aprovada') return 'feito';
  if (etapa.status === 'atrasada') return 'atrasado';
  if (etapa.id === atualId) return 'atual';
  return 'futuro';
}

/* ---------- Versao ---------- */

export function LinhaVersao({
  versao,
  feedback,
  aoPressionar,
  ultima,
}: {
  versao: Versao;
  feedback?: Feedback;
  aoPressionar?: () => void;
  ultima?: boolean;
}) {
  return (
    <Pressable
      disabled={!aoPressionar}
      onPress={aoPressionar}
      accessibilityRole={aoPressionar ? 'button' : undefined}
      accessibilityLabel={`Versão ${versao.numero}, ${versao.nome}, enviada ${diaMes(versao.enviadaEm.slice(0, 10))}${
        feedback ? `, parecer ${PARECER[feedback.parecer].rotulo}` : ', aguardando parecer'
      }`}
      style={({ pressed }) => [estilos.versao, !ultima && estilos.linhaBorda, pressed && estilos.pressionado]}
    >
      <View style={estilos.miniaturaPdf}>
        <Texto style={estilos.miniaturaNumero}>v{versao.numero}</Texto>
        <Texto style={estilos.miniaturaPdfTexto}>PDF</Texto>
      </View>
      <View style={estilos.linhaTextos}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {versao.nome}
        </Texto>
        <Texto variante="legenda">
          {(versao.tamanhoKb / 1024).toFixed(1).replace('.', ',')} MB · {tempoDecorrido(versao.enviadaEm)}
          {versao.comAtraso ? ' · com atraso' : ''}
        </Texto>
      </View>
      {feedback ? (
        <Chip pequeno rotulo={PARECER[feedback.parecer].rotulo} tom={PARECER[feedback.parecer].tom} />
      ) : (
        <Chip pequeno rotulo="Aguardando" tom="revisao" />
      )}
    </Pressable>
  );
}

/* ---------- Carta de parecer ---------- */

export function CartaParecer({
  feedback,
  numeroVersao,
  novo,
}: {
  feedback: Feedback;
  numeroVersao: number;
  /** Mostra o grifo "NOVO" (parecer ainda nao lido ao abrir a tela). */
  novo?: boolean;
}) {
  const p = PARECER[feedback.parecer];
  return (
    <View style={estilos.carta} accessible accessibilityLabel={`Parecer de ${feedback.autor} sobre a versão ${numeroVersao}: ${p.rotulo}. ${feedback.comentarios}`}>
      <View style={[estilos.cartaMarca, { backgroundColor: corDoTom(p.tom) }]} />
      <View style={estilos.cartaTopo}>
        <Avatar nome={feedback.autor} />
        <View style={estilos.linhaTextos}>
          <Texto variante="corpoForte" style={{ fontSize: 15 }}>
            {feedback.autor}
          </Texto>
          <Texto variante="legenda">
            Parecer sobre a v{numeroVersao} · {tempoDecorrido(feedback.criadoEm)}
          </Texto>
        </View>
        {novo && <Grifo rotulo="NOVO" />}
      </View>
      <Texto variante="citacao">“{feedback.comentarios}”</Texto>
      <View style={estilos.cartaRodape}>
        <Icone nome={feedback.parecer === 'aprovado' ? 'check' : 'revisar'} tamanho={16} cor={corDoTom(p.tom)} espessura={2.2} />
        <Texto variante="corpo" style={{ fontFamily: fontes.sansMedio, fontSize: 14 }}>
          {feedback.parecer === 'aprovado' ? 'Parecer: etapa aprovada' : 'Parecer: revisar e reenviar'}
        </Texto>
      </View>
    </View>
  );
}

/* ---------- Resumo de prazo ---------- */

export function TextoPrazo({ etapa }: { etapa: Etapa }) {
  const vencida = etapa.status !== 'aprovada' && prazoRelativo(etapa.prazo).startsWith('venceu');
  return (
    <Texto variante="legenda" cor={vencida && etapa.status === 'atrasada' ? cores.atrasada : cores.suave}>
      {etapa.tipo === 'final' ? 'Final' : 'Parcial'}
      {etapa.obrigatoria ? ' · obrigatória' : ''} · prazo {diaMes(etapa.prazo)}
      {etapa.status !== 'aprovada' ? ` (${prazoRelativo(etapa.prazo)})` : ''}
    </Texto>
  );
}

const estilos = StyleSheet.create({
  segmentos: {
    flexDirection: 'row',
    gap: 4,
  },
  segmento: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  numeroGrifado: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: cores.grifo,
    paddingHorizontal: 6,
  },
  numeroGrande: {
    fontFamily: fontes.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.3,
    color: cores.tinta,
  },
  numeroTotal: {
    fontFamily: fontes.displayLeve,
    fontSize: 22,
    lineHeight: 50,
    color: cores.tinta,
  },
  blocoData: {
    width: 44,
    flexShrink: 0,
    alignItems: 'center',
  },
  blocoDia: {
    fontFamily: fontes.display,
    fontSize: 22,
    lineHeight: 25,
    color: cores.tinta,
  },
  blocoMes: {
    fontSize: 11,
    lineHeight: 14,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    minHeight: 60,
  },
  linhaBorda: {
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  linhaTextos: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pressionado: {
    opacity: 0.6,
  },
  marco: {
    flexDirection: 'row',
    gap: 16,
  },
  trilho: {
    width: 28,
    alignItems: 'center',
  },
  no: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noNumero: {
    fontFamily: fontes.monoForte,
    fontSize: 12,
    color: cores.suave,
  },
  trilhoLinha: {
    width: 2,
    flex: 1,
    backgroundColor: cores.linha,
  },
  marcoConteudo: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 26,
    gap: 12,
  },
  versao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  miniaturaPdf: {
    width: 42,
    height: 50,
    borderRadius: raio.sm,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.linha,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  miniaturaNumero: {
    fontFamily: fontes.monoForte,
    fontSize: 12,
    color: cores.tinta,
  },
  miniaturaPdfTexto: {
    fontFamily: fontes.monoForte,
    fontSize: 9,
    color: cores.atrasada,
  },
  carta: {
    gap: 18,
    padding: 20,
    paddingTop: 22,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.fundo,
    overflow: 'hidden',
  },
  cartaMarca: {
    position: 'absolute',
    left: 0,
    top: 22,
    width: 4,
    height: 40,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  cartaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartaRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
  },
});
