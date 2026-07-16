import type { LayoutDocument } from "@/types/layout";

export type SiteStatus = "draft" | "published" | "archived";

export interface UserRow {
  id: string;
  clerk_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInsert {
  id?: string;
  clerk_id: string;
  email: string;
  display_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type UserUpdate = Partial<UserInsert>;

export interface GeneratedSiteRow {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  layout_json: LayoutDocument;
  status: SiteStatus;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedSiteInsert {
  id?: string;
  user_id: string;
  name: string;
  prompt: string;
  layout_json: LayoutDocument;
  status?: SiteStatus;
  slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type GeneratedSiteUpdate = Partial<GeneratedSiteInsert>;

/**
 * Minimal typed schema shape for `@supabase/supabase-js` generics.
 * Mirrors `supabase/migrations/001_init.sql` exactly.
 *
 * `Relationships` is required by `@supabase/supabase-js`'s `GenericTable`
 * constraint (used to type PostgREST embedded-resource queries); this
 * skeleton does not use embedding, so it is left empty on both tables.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      generated_sites: {
        Row: GeneratedSiteRow;
        Insert: GeneratedSiteInsert;
        Update: GeneratedSiteUpdate;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
