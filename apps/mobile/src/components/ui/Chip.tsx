import { StyleSheet, View } from 'react-native';

import type { Tom } from '../../lib/dominio';
import { cores, fontes, raio } from '../../tema/tokens';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

const TONS: Record<Tom, { texto: string; fundo: string; icone: NomeIcone }> = {
  aprovada: { texto: cores.aprovada, fundo: cores.aprovadaFundo, icone: 'check' },
  revisao: { texto: cores.revisao, fundo: cores.revisaoFundo, icone: 'relogio' },
  revisar: { texto: cores.revisar, fundo: cores.revisarFundo, icone: 'revisar' },
  atrasada: { texto: cores.atrasada, fundo: cores.atrasadaFundo, icone: 'alerta' },
  neutro: { texto: cores.suave, fundo: cores.superficie, icone: 'relogio' },
};

type Props = {
  rotulo: string;
  tom: Tom;
  /** Sobrescreve o icone padrao do tom. */
  icone?: NomeIcone;
  pequeno?: boolean;
};

/** Status sempre com icone + texto: nunca so pela cor (WCAG 1.4.1). */
export function Chip({ rotulo, tom, icone, pequeno }: Props) {
  const t = TONS[tom];
  return (
    <View style={[estilos.chip, pequeno && estilos.pequeno, { backgroundColor: t.fundo }]}>
      <Icone nome={icone ?? t.icone} tamanho={pequeno ? 11 : 12} cor={t.texto} espessura={2.8} />
      <Texto style={[estilos.rotulo, pequeno && estilos.rotuloPequeno]} cor={t.texto}>
        {rotulo}
      </Texto>
    </View>
  );
}

/** Etiqueta amarela "NOVO", o grifo aplicado a algo nao lido. */
export function Grifo({ rotulo }: { rotulo: string }) {
  return (
    <View style={estilos.grifo}>
      <Texto style={estilos.grifoTexto}>{rotulo}</Texto>
    </View>
  );
}

export function corDoTom(tom: Tom): string {
  return TONS[tom].texto;
}

const estilos = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: raio.total,
  },
  pequeno: {
    paddingVertical: 3,
    paddingLeft: 7,
    paddingRight: 8,
  },
  rotulo: {
    fontFamily: fontes.sansForte,
    fontSize: 13,
    lineHeight: 17,
  },
  rotuloPequeno: {
    fontSize: 12,
    lineHeight: 15,
  },
  grifo: {
    backgroundColor: cores.grifo,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  grifoTexto: {
    fontFamily: fontes.monoForte,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    color: cores.tinta,
  },
});
