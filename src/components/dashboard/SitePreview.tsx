import type { LayoutDocument } from "@/types/layout";
import BlockRenderer from "@/components/blocks/BlockRenderer";

interface SitePreviewProps {
  layout: LayoutDocument | null;
}

export default function SitePreview({ layout }: SitePreviewProps) {
  if (!layout) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-700 bg-stone-900/40 p-12 text-center">
        <p className="text-sm font-medium text-stone-300">No preview yet</p>
        <p className="max-w-sm text-sm text-stone-500">
          Describe your business and generate a layout to see it rendered
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800">
      <BlockRenderer layout={layout} />
    </div>
  );
}
