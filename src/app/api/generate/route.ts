import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateLayoutDetailed } from "@/lib/llm";
import { createServerClient } from "@/lib/supabase/server";
import type {
  GeneratedSiteInsert,
  UserInsert,
  UserRow,
} from "@/lib/supabase/types";
import {
  layoutDocumentSchema,
  type LayoutDocument,
} from "@/types/layout";

/** Allow slower local / remote LLM calls on Vercel Pro; ignored on Hobby. */
export const maxDuration = 60;

const requestBodySchema = z.object({
  prompt: z.string().min(1).max(4000),
  siteName: z.string().min(1).max(200).optional(),
  provider: z.enum(["deepseek", "glm", "ollama"]).optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = requestBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        issues: parsedBody.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const { prompt, siteName, provider } = parsedBody.data;

  let layout: LayoutDocument;
  let meta: { provider: string; model: string | null; usedFallback: boolean };
  try {
    const generated = await generateLayoutDetailed(prompt, {
      siteName,
      provider,
    });
    layout = layoutDocumentSchema.parse(generated.layout);
    meta = {
      provider: generated.provider,
      model: generated.model,
      usedFallback: generated.usedFallback,
    };
  } catch {
    return NextResponse.json(
      { error: "Failed to generate a valid layout" },
      { status: 502 },
    );
  }

  await persistGeneratedSite({ userId, prompt, layout }).catch((error) => {
    console.error("generated_sites persist failed:", error);
  });

  return NextResponse.json({ layout, meta }, { status: 200 });
}

interface PersistArgs {
  userId: string;
  prompt: string;
  layout: LayoutDocument;
}

async function persistGeneratedSite({
  userId,
  prompt,
  layout,
}: PersistArgs): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) {
    return;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    return;
  }

  const userInsert: UserInsert = {
    clerk_id: userId,
    email,
    display_name: clerkUser?.fullName ?? null,
  };

  const { data: userRow, error: userError } = (await supabase
    .from("users")
    .upsert(userInsert, { onConflict: "clerk_id" })
    .select()
    .single()) as { data: UserRow | null; error: { message: string } | null };

  if (userError || !userRow) {
    return;
  }

  const siteInsert: GeneratedSiteInsert = {
    user_id: userRow.id,
    name: layout.meta.siteName,
    prompt,
    layout_json: layout,
    status: "draft",
  };

  await supabase.from("generated_sites").insert(siteInsert);
}
