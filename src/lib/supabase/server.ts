import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 *
 * This bypasses RLS entirely, so it must only be used inside server
 * contexts (Route Handlers, Server Actions, Server Components) AFTER a
 * successful Clerk `auth()` check. Never import this module from a
 * "use client" component — the service role key must never reach the
 * browser bundle.
 *
 * Returns `null` when Supabase env vars are not configured, so callers can
 * gracefully skip persistence in the skeleton (see plan §7, Subagent B).
 *
 * Intentionally left untyped by `Database` (from `@/lib/supabase/types`):
 * the installed `@supabase/supabase-js` version's `SupabaseClient<Database>`
 * generic default resolves table Insert/Update generics to `never` for this
 * schema shape, breaking `.insert()`/`.upsert()` typings. Callers should
 * annotate query results with the row types from `@/lib/supabase/types`.
 */
export function createServerClient(): SupabaseClient | null {
  if (serverClient) {
    return serverClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  serverClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}
