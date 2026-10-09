/**
 * Popula o banco com dados de exemplo para desenvolvimento. Idempotente:
 * cada registro é localizado por uma chave natural antes de ser inserido,
 * então rodar `bun run db:seed` várias vezes não duplica nada.
 */
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { DATABASE_URL, db, schema } from "./index";

const DOMINIO = "exemplo.edu.br";
/** Senha de todas as contas de exemplo (Better Auth). */
const SENHA_PADRAO = "senha123";
const agora = new Date();
const diasAFrente = (dias: number) =>
  new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

async function seed() {
  // Parâmetros (linha única)
  let parametro = await db.query.parametros.findFirst();
  if (!parametro) {
    [parametro] = await db
      .insert(schema.parametros)
      .values({ limite_orientandos: 5, dominio_email: DOMINIO })
      .returning();
  }

  // Curso
  let curso = await db.query.cursos.findFirst({
    where: eq(schema.cursos.sigla, "CC"),
  });
  if (!curso) {
    [curso] = await db
      .insert(schema.cursos)
      .values({ nome: "Ciência da Computação", sigla: "CC" })
      .returning();
  }

  // Semestre
  let semestre = await db.query.semestres.findFirst({
    where: eq(schema.semestres.codigo, "2026.2"),
  });
  if (!semestre) {
    [semestre] = await db
      .insert(schema.semestres)
      .values({
        codigo: "2026.2",
        data_inicio: "2026-08-03",
        data_fim: "2026-12-12",
        ativo: true,
      })
      .returning();
  }

  // Usuários
  const garantirUsuario = async (dados: {
    nome: string;
    email: string;
    perfil: (typeof schema.PERFIS_USUARIO)[number];
  }) => {
    const existente = await db.query.usuarios.findFirst({
      where: eq(schema.usuarios.email, dados.email),
    });
    if (existente) return existente;
    const [criado] = await db
      .insert(schema.usuarios)
      .values({
        ...dados,
        curso_id: curso!.id,
        email_confirmado_em: agora,
      })
      .returning();
    return criado!;
  };

  const admin = await garantirUsuario({
    nome: "Administrador",
    email: `admin@${DOMINIO}`,
    perfil: "admin",
  });
  const professor = await garantirUsuario({
    nome: "Profa. Ana Souza",
    email: `ana.souza@${DOMINIO}`,
    perfil: "professor",
  });
  const aluno = await garantirUsuario({
    nome: "Carlos Lima",
    email: `carlos.lima@${DOMINIO}`,
    perfil: "aluno",
  });

  // Contas do Better Auth (UC10/UC11) ligadas aos usuários de domínio,
  // com e-mail já confirmado e senha padrão.
  const garantirConta = async (usuario: typeof schema.usuarios.$inferSelect) => {
    const existente = await db.query.user.findFirst({
      where: eq(schema.user.email, usuario.email),
    });
    if (existente) return existente;
    const [conta] = await db
      .insert(schema.user)
      .values({
        id: crypto.randomUUID(),
        name: usuario.nome,
        email: usuario.email,
        emailVerified: true,
        perfil: usuario.perfil,
        curso_id: usuario.curso_id,
        usuario_id: usuario.id,
      })
      .returning();
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: conta!.id,
      providerId: "credential",
      userId: conta!.id,
      password: await hashPassword(SENHA_PADRAO),
    });
    if (!usuario.email_confirmado_em) {
      await db
        .update(schema.usuarios)
        .set({ email_confirmado_em: agora })
        .where(eq(schema.usuarios.id, usuario.id));
    }
    return conta!;
  };
  await garantirConta(admin);
  await garantirConta(professor);
  await garantirConta(aluno);

  // Proposta aceita
  let proposta = await db.query.propostas.findFirst({
    where: and(
      eq(schema.propostas.aluno_id, aluno.id),
      eq(schema.propostas.professor_id, professor.id),
    ),
  });
  if (!proposta) {
    [proposta] = await db
      .insert(schema.propostas)
      .values({
        aluno_id: aluno.id,
        professor_id: professor.id,
        tema: "Acompanhamento de TCC com aplicativo móvel",
        resumo:
          "Desenvolvimento de um aplicativo para gestão do fluxo de orientação de TCC.",
        objetivos:
          "Modelar os componentes do sistema, implementar a API e o app e avaliar com usuários.",
        area_pesquisa: "Engenharia de Software",
        status: "aceita",
        submetida_em: agora,
        respondida_em: agora,
      })
      .returning();
  }

  // Trabalho em orientação
  let trabalho = await db.query.trabalhos.findFirst({
    where: eq(schema.trabalhos.proposta_id, proposta!.id),
  });
  if (!trabalho) {
    [trabalho] = await db
      .insert(schema.trabalhos)
      .values({
        proposta_id: proposta!.id,
        aluno_id: aluno.id,
        orientador_id: professor.id,
        semestre_id: semestre!.id,
        titulo: proposta!.tema,
        status: "em_orientacao",
      })
      .returning();
  }

  // Vínculo de orientação (convite aceito)
  const convite = await db.query.convites_orientacao.findFirst({
    where: and(
      eq(schema.convites_orientacao.trabalho_id, trabalho!.id),
      eq(schema.convites_orientacao.orientador_id, professor.id),
    ),
  });
  if (!convite) {
    await db.insert(schema.convites_orientacao).values({
      trabalho_id: trabalho!.id,
      orientador_id: professor.id,
      status: "aceito",
      respondido_em: agora,
    });
  }

  // Cronograma publicado com 3 etapas
  let cronograma = await db.query.cronogramas.findFirst({
    where: eq(schema.cronogramas.trabalho_id, trabalho!.id),
  });
  if (!cronograma) {
    [cronograma] = await db
      .insert(schema.cronogramas)
      .values({
        trabalho_id: trabalho!.id,
        criado_por_id: professor.id,
        publicado_em: agora,
      })
      .returning();
  }

  const etapasDesejadas = [
    { nome: "Revisão bibliográfica", tipo: "parcial", prazo: diasAFrente(-7), ordem: 1 },
    { nome: "Protótipo funcional", tipo: "parcial", prazo: diasAFrente(30), ordem: 2 },
    { nome: "Monografia final", tipo: "final", prazo: diasAFrente(90), ordem: 3 },
  ] as const;

  const etapas: (typeof schema.etapas.$inferSelect)[] = [];
  for (const dados of etapasDesejadas) {
    let etapa = await db.query.etapas.findFirst({
      where: and(
        eq(schema.etapas.cronograma_id, cronograma!.id),
        eq(schema.etapas.nome, dados.nome),
      ),
    });
    if (!etapa) {
      [etapa] = await db
        .insert(schema.etapas)
        .values({ ...dados, cronograma_id: cronograma!.id, obrigatoria: true })
        .returning();
    }
    etapas.push(etapa!);
  }

  // Entrega da primeira etapa, com 1 versão e 1 feedback
  const primeiraEtapa = etapas[0]!;
  let entrega = await db.query.entregas.findFirst({
    where: and(
      eq(schema.entregas.trabalho_id, trabalho!.id),
      eq(schema.entregas.etapa_id, primeiraEtapa.id),
    ),
  });
  if (!entrega) {
    [entrega] = await db
      .insert(schema.entregas)
      .values({
        trabalho_id: trabalho!.id,
        etapa_id: primeiraEtapa.id,
        status: "em_revisao",
      })
      .returning();
  }

  let versao = await db.query.versoes.findFirst({
    where: and(
      eq(schema.versoes.entrega_id, entrega!.id),
      eq(schema.versoes.numero, 1),
    ),
  });
  if (!versao) {
    [versao] = await db
      .insert(schema.versoes)
      .values({
        entrega_id: entrega!.id,
        numero: 1,
        arquivo: "uploads/exemplo/revisao-bibliografica-v1.pdf",
        nome_original: "revisao-bibliografica.pdf",
        enviada_por_id: aluno.id,
      })
      .returning();
  }

  const feedback = await db.query.feedbacks.findFirst({
    where: eq(schema.feedbacks.versao_id, versao!.id),
  });
  if (!feedback) {
    await db.insert(schema.feedbacks).values({
      versao_id: versao!.id,
      autor_id: professor.id,
      parecer: "revisar",
      comentarios:
        "Boa base teórica. Inclua trabalhos relacionados mais recentes (últimos 3 anos) e revise as citações.",
    });
  }

  console.log(
    `Seed aplicado em ${DATABASE_URL}: admin #${admin.id}, professor #${professor.id}, aluno #${aluno.id} (contas Better Auth com senha "${SENHA_PADRAO}"), trabalho #${trabalho!.id}, cronograma #${cronograma!.id} (${etapas.length} etapas), entrega #${entrega!.id}.`,
  );
}

await seed();
