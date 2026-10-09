import { Elysia } from "elysia";

export const health = new Elysia({ name: "routes/health" }).get(
  "/health",
  () => ({
    status: "ok" as const,
    service: "orientatcc-api" as const,
    timestamp: new Date().toISOString(),
  }),
  {
    detail: {
      tags: ["Health"],
      summary: "Verifica se a API está no ar",
    },
  },
);
