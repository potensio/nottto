import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import "dotenv/config";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function resetData() {
  console.log("🗑️  Truncating all tables...");

  // Truncate all tables with CASCADE to handle foreign keys
  await db.execute(sql`
    TRUNCATE TABLE 
      annotations,
      webhook_integrations,
      projects,
      workspace_members,
      workspaces,
      magic_link_tokens,
      rate_limit_records,
      users
    CASCADE
  `);

  console.log("✅ All data cleared! Schema intact.");
}

resetData().catch(console.error);
