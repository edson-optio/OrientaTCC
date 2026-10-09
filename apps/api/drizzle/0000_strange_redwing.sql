CREATE TABLE `cursos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`sigla` text,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parametros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`limite_orientandos` integer DEFAULT 5 NOT NULL,
	`dominio_email` text,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `semestres` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`data_inicio` text NOT NULL,
	`data_fim` text NOT NULL,
	`ativo` integer DEFAULT false NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `semestres_codigo_unique` ON `semestres` (`codigo`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`perfil` text NOT NULL,
	`curso_id` integer,
	`ativo` integer DEFAULT true NOT NULL,
	`email_confirmado_em` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`curso_id`) REFERENCES `cursos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);--> statement-breakpoint
CREATE TABLE `propostas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`aluno_id` integer NOT NULL,
	`professor_id` integer NOT NULL,
	`tema` text NOT NULL,
	`resumo` text NOT NULL,
	`objetivos` text NOT NULL,
	`area_pesquisa` text NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`justificativa` text,
	`submetida_em` integer,
	`respondida_em` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`aluno_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`professor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trabalhos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`proposta_id` integer NOT NULL,
	`aluno_id` integer NOT NULL,
	`orientador_id` integer,
	`semestre_id` integer,
	`titulo` text NOT NULL,
	`status` text DEFAULT 'aguardando_orientador' NOT NULL,
	`resultado_final` text,
	`parecer_conclusivo` text,
	`prazo_correcao` text,
	`concluido_em` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`proposta_id`) REFERENCES `propostas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`aluno_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`orientador_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`semestre_id`) REFERENCES `semestres`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trabalhos_proposta_id_unique` ON `trabalhos` (`proposta_id`);--> statement-breakpoint
CREATE TABLE `convites_orientacao` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trabalho_id` integer NOT NULL,
	`orientador_id` integer NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`justificativa` text,
	`respondido_em` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trabalho_id`) REFERENCES `trabalhos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`orientador_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cronogramas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trabalho_id` integer NOT NULL,
	`criado_por_id` integer,
	`copiado_de` integer,
	`publicado_em` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trabalho_id`) REFERENCES `trabalhos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`criado_por_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`copiado_de`) REFERENCES `cronogramas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cronogramas_trabalho_id_unique` ON `cronogramas` (`trabalho_id`);--> statement-breakpoint
CREATE TABLE `etapas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cronograma_id` integer NOT NULL,
	`nome` text NOT NULL,
	`tipo` text DEFAULT 'parcial' NOT NULL,
	`prazo` text NOT NULL,
	`obrigatoria` integer DEFAULT true NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cronograma_id`) REFERENCES `cronogramas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entregas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trabalho_id` integer NOT NULL,
	`etapa_id` integer NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`trabalho_id`) REFERENCES `trabalhos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`etapa_id`) REFERENCES `etapas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entregas_trabalho_etapa` ON `entregas` (`trabalho_id`,`etapa_id`);--> statement-breakpoint
CREATE TABLE `feedbacks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`versao_id` integer NOT NULL,
	`autor_id` integer NOT NULL,
	`parecer` text NOT NULL,
	`comentarios` text,
	`lido_em` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`versao_id`) REFERENCES `versoes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `versoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entrega_id` integer NOT NULL,
	`numero` integer NOT NULL,
	`arquivo` text NOT NULL,
	`nome_original` text,
	`enviada_por_id` integer,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`entrega_id`) REFERENCES `entregas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`enviada_por_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `versoes_entrega_numero` ON `versoes` (`entrega_id`,`numero`);--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`destinatario_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text NOT NULL,
	`mensagem` text,
	`dados` text,
	`lida_em` integer,
	`enviada_em` integer,
	`tentativas_envio` integer DEFAULT 0 NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`destinatario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
