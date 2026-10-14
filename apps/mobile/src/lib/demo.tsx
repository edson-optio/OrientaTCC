/**
 * Store de DEMONSTRACAO do app.
 *
 * A API ainda nao expoe proposta, trabalho nem cronograma (ver README, Lab 4),
 * e as rotas de entregas/feedback exigem a sessao Better Auth, que o mobile
 * ainda nao implementa. Para que o novo design seja navegavel de ponta a
 * ponta, este store guarda em memoria um estado coerente com o seed da API
 * (Carlos Lima, Profa. Ana Souza, tres etapas com datas relativas a hoje) e
 * aplica localmente as mesmas regras de negocio:
 *   - so PDF ate 2 MiB; cada envio cria a proxima versao;
 *   - envio apos o prazo vira "entregue_com_atraso";
 *   - parecer "aprovado" -> entrega "aprovada"; "revisar" -> "em_revisao";
 *   - aceite de proposta respeita o limite de orientandos.
 * Beatriz, Rafael, Juliana e Lucas NAO existem no seed: foram acrescentados
 * para o painel do orientador nao ficar vazio.
 *
 * Quando os endpoints existirem, as acoes abaixo viram chamadas em src/lib/api.
 */
import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { diasAte, hojeMais } from './datas';
import type { Etapa, Parecer, Proposta, Trabalho } from './dominio';

export const LIMITE_ORIENTANDOS = 5;
export const TAMANHO_MAXIMO_KB = 2048;

function agoraMenos(horas: number): string {
  return new Date(Date.now() - horas * 3600_000).toISOString();
}

function estadoInicial(): EstadoDemo {
  const trabalhoCarlos: Trabalho = {
    id: 1,
    titulo: 'Acompanhamento de TCC com aplicativo móvel',
    aluno: 'Carlos Lima',
    curso: 'Ciência da Computação',
    orientador: 'Profa. Ana Souza',
    semestre: '2026.2',
    status: 'em_orientacao',
    propostaAceitaEm: hojeMais(-23),
    cronogramaPublicadoEm: hojeMais(-16),
    etapas: [
      {
        id: 1,
        nome: 'Revisão bibliográfica',
        tipo: 'parcial',
        obrigatoria: true,
        prazo: hojeMais(-7),
        status: 'em_revisao',
        versoes: [
          {
            id: 1,
            numero: 1,
            nome: 'revisao-bibliografica.pdf',
            tamanhoKb: 1420,
            enviadaEm: agoraMenos(24 * 8),
            comAtraso: false,
          },
        ],
        feedbacks: [
          {
            id: 1,
            versaoId: 1,
            parecer: 'revisar',
            comentarios:
              'Boa base teórica. Inclua trabalhos relacionados mais recentes (últimos 3 anos) e revise as citações.',
            autor: 'Profa. Ana Souza',
            criadoEm: agoraMenos(24 * 5),
            lidoEm: null,
          },
        ],
      },
      etapaVazia(2, 'Protótipo funcional', 'parcial', 30),
      etapaVazia(3, 'Monografia final', 'final', 90),
    ],
  };

  const trabalhoBeatriz: Trabalho = {
    id: 2,
    titulo: 'Detecção de desinformação em português com modelos de linguagem',
    aluno: 'Beatriz Nunes',
    curso: 'Ciência da Computação',
    orientador: 'Profa. Ana Souza',
    semestre: '2026.2',
    status: 'em_orientacao',
    propostaAceitaEm: hojeMais(-40),
    cronogramaPublicadoEm: hojeMais(-35),
    etapas: [
      {
        ...etapaVazia(11, 'Revisão bibliográfica', 'parcial', -14),
        status: 'aprovada',
        versoes: [versao(21, 1, 'revisao-beatriz.pdf', 24 * 16, false)],
        feedbacks: [
          {
            id: 21,
            versaoId: 21,
            parecer: 'aprovado',
            comentarios: 'Excelente recorte. Pode seguir para a coleta do corpus.',
            autor: 'Profa. Ana Souza',
            criadoEm: agoraMenos(24 * 13),
            lidoEm: agoraMenos(24 * 12),
          },
        ],
      },
      {
        ...etapaVazia(12, 'Coleta e anotação do corpus', 'parcial', 3),
        status: 'entregue',
        versoes: [
          versao(22, 1, 'corpus-v1.pdf', 24 * 6, false),
          versao(23, 2, 'corpus-v2.pdf', 2, false),
        ],
        feedbacks: [
          {
            id: 22,
            versaoId: 22,
            parecer: 'revisar',
            comentarios: 'Descreva o critério de concordância entre anotadores.',
            autor: 'Profa. Ana Souza',
            criadoEm: agoraMenos(24 * 4),
            lidoEm: agoraMenos(24 * 4),
          },
        ],
      },
      etapaVazia(13, 'Monografia final', 'final', 75),
    ],
  };

  const trabalhoRafael: Trabalho = {
    id: 3,
    titulo: 'Monitoramento de hortas urbanas com sensores IoT',
    aluno: 'Rafael Moreira',
    curso: 'Ciência da Computação',
    orientador: 'Profa. Ana Souza',
    semestre: '2026.2',
    status: 'em_orientacao',
    propostaAceitaEm: hojeMais(-30),
    cronogramaPublicadoEm: hojeMais(-28),
    etapas: [
      { ...etapaVazia(31, 'Levantamento de requisitos', 'parcial', -4), status: 'atrasada' },
      etapaVazia(32, 'Protótipo do sensor', 'parcial', 26),
      etapaVazia(33, 'Monografia final', 'final', 80),
    ],
  };

  const propostas: Proposta[] = [
    {
      id: 10,
      aluno: 'Juliana Prado',
      curso: 'Sistemas de Informação',
      tema: 'Acessibilidade em aplicativos bancários para pessoas idosas',
      resumo:
        'Avaliação heurística e testes com usuários acima de 65 anos em três aplicativos bancários, propondo um guia de padrões acessíveis.',
      objetivos: 'Mapear barreiras de uso; propor e validar padrões de interface.',
      area: 'Interação Humano-Computador',
      status: 'aguardando_orientador',
      submetidaEm: agoraMenos(20),
    },
    {
      id: 11,
      aluno: 'Lucas Ferreira',
      curso: 'Ciência da Computação',
      tema: 'Otimização de rotas de coleta seletiva com algoritmos genéticos',
      resumo:
        'Modelagem do problema de roteamento de veículos para a coleta seletiva municipal e comparação entre heurísticas.',
      objetivos: 'Reduzir a distância percorrida; comparar desempenho com a rota atual.',
      area: 'Pesquisa Operacional',
      status: 'aguardando_orientador',
      submetidaEm: agoraMenos(24 * 3),
    },
  ];

  const propostaCarlos: Proposta = {
    id: 1,
    aluno: 'Carlos Lima',
    curso: 'Ciência da Computação',
    tema: 'Acompanhamento de TCC com aplicativo móvel',
    resumo:
      'Aplicativo móvel para gestão da orientação de TCC: propostas, cronograma, entregas versionadas e feedback do orientador.',
    objetivos: 'Centralizar o acompanhamento; reduzir atrasos; preservar o histórico de versões e pareceres.',
    area: 'Engenharia de Software',
    status: 'aceita',
    submetidaEm: hojeMais(-25),
  };

  return {
    trabalhos: [trabalhoCarlos, trabalhoBeatriz, trabalhoRafael],
    propostasRecebidas: propostas,
    propostaAluno: propostaCarlos,
  };
}

function etapaVazia(id: number, nome: string, tipo: Etapa['tipo'], diasPrazo: number): Etapa {
  return { id, nome, tipo, obrigatoria: true, prazo: hojeMais(diasPrazo), status: 'pendente', versoes: [], feedbacks: [] };
}

function versao(id: number, numero: number, nome: string, horasAtras: number, comAtraso: boolean) {
  return { id, numero, nome, tamanhoKb: 900 + numero * 230, enviadaEm: agoraMenos(horasAtras), comAtraso };
}

interface EstadoDemo {
  trabalhos: Trabalho[];
  propostasRecebidas: Proposta[];
  propostaAluno: Proposta;
}

type Acao =
  | { tipo: 'enviarVersao'; trabalhoId: number; etapaId: number; nome: string; tamanhoKb: number }
  | { tipo: 'registrarParecer'; trabalhoId: number; etapaId: number; parecer: Parecer; comentarios: string }
  | { tipo: 'marcarLido'; trabalhoId: number; feedbackId: number }
  | { tipo: 'responderProposta'; propostaId: number; decisao: 'aceita' | 'ajustes' | 'recusada'; justificativa?: string }
  | { tipo: 'reiniciar' };

let proximoId = 1000;

function atualizarEtapa(estado: EstadoDemo, trabalhoId: number, etapaId: number, fn: (e: Etapa) => Etapa): EstadoDemo {
  return {
    ...estado,
    trabalhos: estado.trabalhos.map((t) =>
      t.id !== trabalhoId ? t : { ...t, etapas: t.etapas.map((e) => (e.id === etapaId ? fn(e) : e)) },
    ),
  };
}

function redutor(estado: EstadoDemo, acao: Acao): EstadoDemo {
  switch (acao.tipo) {
    case 'enviarVersao':
      return atualizarEtapa(estado, acao.trabalhoId, acao.etapaId, (e) => {
        const atrasada = diasAte(e.prazo) < 0;
        return {
          ...e,
          status: atrasada ? 'entregue_com_atraso' : 'entregue',
          versoes: [
            ...e.versoes,
            {
              id: ++proximoId,
              numero: e.versoes.length + 1,
              nome: acao.nome,
              tamanhoKb: acao.tamanhoKb,
              enviadaEm: new Date().toISOString(),
              comAtraso: atrasada,
            },
          ],
        };
      });
    case 'registrarParecer':
      return atualizarEtapa(estado, acao.trabalhoId, acao.etapaId, (e) => {
        const ultima = e.versoes[e.versoes.length - 1];
        if (!ultima) return e;
        return {
          ...e,
          status: acao.parecer === 'aprovado' ? 'aprovada' : 'em_revisao',
          feedbacks: [
            ...e.feedbacks,
            {
              id: ++proximoId,
              versaoId: ultima.id,
              parecer: acao.parecer,
              comentarios: acao.comentarios,
              autor: 'Profa. Ana Souza',
              criadoEm: new Date().toISOString(),
              lidoEm: null,
            },
          ],
        };
      });
    case 'marcarLido':
      return {
        ...estado,
        trabalhos: estado.trabalhos.map((t) =>
          t.id !== acao.trabalhoId
            ? t
            : {
                ...t,
                etapas: t.etapas.map((e) => ({
                  ...e,
                  feedbacks: e.feedbacks.map((f) =>
                    f.id === acao.feedbackId && !f.lidoEm ? { ...f, lidoEm: new Date().toISOString() } : f,
                  ),
                })),
              },
        ),
      };
    case 'responderProposta': {
      const proposta = estado.propostasRecebidas.find((p) => p.id === acao.propostaId);
      if (!proposta) return estado;
      const propostasRecebidas = estado.propostasRecebidas.map((p) =>
        p.id === acao.propostaId ? { ...p, status: acao.decisao, justificativa: acao.justificativa } : p,
      );
      if (acao.decisao !== 'aceita') return { ...estado, propostasRecebidas };
      const novo: Trabalho = {
        id: ++proximoId,
        titulo: proposta.tema,
        aluno: proposta.aluno,
        curso: proposta.curso,
        orientador: 'Profa. Ana Souza',
        semestre: '2026.2',
        status: 'em_orientacao',
        propostaAceitaEm: hojeMais(0),
        cronogramaPublicadoEm: null,
        etapas: [],
      };
      return { ...estado, propostasRecebidas, trabalhos: [...estado.trabalhos, novo] };
    }
    case 'reiniciar':
      return estadoInicial();
  }
}

interface ContextoDemo {
  estado: EstadoDemo;
  /** Trabalho do aluno logado (Carlos, no seed). */
  meuTrabalho: Trabalho;
  orientandosAtivos: Trabalho[];
  enviarVersao: (trabalhoId: number, etapaId: number, nome: string, tamanhoKb: number) => void;
  registrarParecer: (trabalhoId: number, etapaId: number, parecer: Parecer, comentarios: string) => void;
  marcarLido: (trabalhoId: number, feedbackId: number) => void;
  responderProposta: (propostaId: number, decisao: 'aceita' | 'ajustes' | 'recusada', justificativa?: string) => void;
  reiniciar: () => void;
}

const Contexto = createContext<ContextoDemo | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(redutor, undefined, estadoInicial);

  const enviarVersao = useCallback(
    (trabalhoId: number, etapaId: number, nome: string, tamanhoKb: number) =>
      despachar({ tipo: 'enviarVersao', trabalhoId, etapaId, nome, tamanhoKb }),
    [],
  );
  const registrarParecer = useCallback(
    (trabalhoId: number, etapaId: number, parecer: Parecer, comentarios: string) =>
      despachar({ tipo: 'registrarParecer', trabalhoId, etapaId, parecer, comentarios }),
    [],
  );
  const marcarLido = useCallback(
    (trabalhoId: number, feedbackId: number) => despachar({ tipo: 'marcarLido', trabalhoId, feedbackId }),
    [],
  );
  const responderProposta = useCallback(
    (propostaId: number, decisao: 'aceita' | 'ajustes' | 'recusada', justificativa?: string) =>
      despachar({ tipo: 'responderProposta', propostaId, decisao, justificativa }),
    [],
  );
  const reiniciar = useCallback(() => despachar({ tipo: 'reiniciar' }), []);

  const valor = useMemo<ContextoDemo>(
    () => ({
      estado,
      meuTrabalho: estado.trabalhos[0],
      orientandosAtivos: estado.trabalhos.filter((t) => t.status === 'em_orientacao'),
      enviarVersao,
      registrarParecer,
      marcarLido,
      responderProposta,
      reiniciar,
    }),
    [estado, enviarVersao, registrarParecer, marcarLido, responderProposta, reiniciar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDemo(): ContextoDemo {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useDemo deve ser usado dentro de DemoProvider');
  return ctx;
}

/* ---------- Derivacoes usadas pelas telas ---------- */

export function etapaAtual(trabalho: Trabalho): Etapa | undefined {
  return trabalho.etapas.find((e) => e.status !== 'aprovada');
}

export function etapasAprovadas(trabalho: Trabalho): number {
  return trabalho.etapas.filter((e) => e.status === 'aprovada').length;
}

export function ultimoFeedback(etapa: Etapa) {
  return etapa.feedbacks[etapa.feedbacks.length - 1];
}

export function aguardandoParecer(etapa: Etapa): boolean {
  return etapa.status === 'entregue' || etapa.status === 'entregue_com_atraso';
}

/** Dias desde a ultima atividade (envio de versao ou parecer) do trabalho. */
export function diasParado(trabalho: Trabalho): number {
  const datas = trabalho.etapas.flatMap((e) => [
    ...e.versoes.map((v) => v.enviadaEm),
    ...e.feedbacks.map((f) => f.criadoEm),
  ]);
  const referencia = datas.length ? datas.sort().at(-1)! : trabalho.cronogramaPublicadoEm ?? trabalho.propostaAceitaEm;
  return Math.max(0, -diasAte(referencia.slice(0, 10)));
}
