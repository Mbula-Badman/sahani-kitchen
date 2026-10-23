import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/schema";

type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  sahaniPool?: Pool;
  sahaniDb?: Database;
};

export function getDb(): Database {
  if (globalForDb.sahaniDb) return globalForDb.sahaniDb;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to use the Sahani Kitchen dashboards.");
  }
  const pool = new Pool({ connectionString, max: 5 });
  globalForDb.sahaniPool = pool;
  globalForDb.sahaniDb = drizzle(pool, { schema });
  return globalForDb.sahaniDb;
}

export async function closeDb() {
  await globalForDb.sahaniPool?.end();
  globalForDb.sahaniPool = undefined;
  globalForDb.sahaniDb = undefined;
}
