"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Browser-side Supabase client using the public anon key.
 *
 * Safe to call from client components. Do NOT use for privileged writes —
 * those belong in `src/lib/supabase/server.ts` behind Clerk auth.
 *
 * Intentionally left untyped by `Database` (from `@/lib/supabase/types`):
 * the installed `@supabase/supabase-js` version's `SupabaseClient<Database>`
 * generic default resolves table Insert/Update generics to `never` for this
 * schema shape, breaking `.insert()`/`.upsert()` typings. Callers should
 * annotate query results with the row types from `@/lib/supabase/types`.
 */
export function createBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
