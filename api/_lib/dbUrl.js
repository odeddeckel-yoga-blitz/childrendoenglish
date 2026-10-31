// Which Neon database the API and tools use. CDE_NEW_DATABASE_URL = the database in the
// Vercel-managed Neon org (integration prefix CDE_NEW, Production + Development; owner
// "move CDE", 10-31). CDE_DATABASE_URL = the previous own project (delicate-hat-45485476),
// and on Preview the hand-set `preview` branch. Rollback = unset CDE_NEW_* (or revert) + redeploy.
export function dbUrl(env = process.env) {
  return env.CDE_NEW_DATABASE_URL || env.CDE_DATABASE_URL || env.DATABASE_URL || env.POSTGRES_URL;
}
