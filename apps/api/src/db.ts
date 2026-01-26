import { createDb, type Database } from "@notto/shared/db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db: Database = createDb(process.env.DATABASE_URL);
