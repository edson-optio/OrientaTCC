/**
 * Aplica as migrações geradas pelo drizzle-kit (pasta `drizzle/`) no banco
 * apontado por DATABASE_URL. Uso: `bun run db:migrate`.
 */
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { DATABASE_URL, db } from "./index";

migrate(db, { migrationsFolder: "./drizzle" });

console.log(`Migrações aplicadas em ${DATABASE_URL}`);
