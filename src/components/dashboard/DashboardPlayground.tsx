"use client";

import { useState } from "react";
import type { LayoutDocument } from "@/types/layout";
import PromptForm from "@/components/dashboard/PromptForm";
import SitePreview from "@/components/dashboard/SitePreview";

export default function DashboardPlayground() {
  const [layout, setLayout] = useState<LayoutDocument | null>(null);

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr] lg:items-start">
      <PromptForm onGenerated={setLayout} />
      <SitePreview layout={layout} />
    </div>
  );
}
