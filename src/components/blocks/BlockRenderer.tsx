import type { BlockData, LayoutDocument, ThemeTokens } from "@/types/layout";
import HeroBlock from "@/components/blocks/HeroBlock";
import FeatureGridBlock from "@/components/blocks/FeatureGridBlock";
import FooterBlock from "@/components/blocks/FooterBlock";

interface BlockRendererProps {
  layout: LayoutDocument;
}

export default function BlockRenderer({ layout }: BlockRendererProps) {
  const { theme, blocks } = layout;

  return (
    <>
      {blocks.map((block, index) => (
        <RenderedBlock key={`${block.type}-${index}`} block={block} theme={theme} />
      ))}
    </>
  );
}

interface RenderedBlockProps {
  block: BlockData;
  theme: ThemeTokens;
}

function RenderedBlock({ block, theme }: RenderedBlockProps) {
  switch (block.type) {
    case "hero":
      return <HeroBlock data={block} theme={theme} />;
    case "featureGrid":
      return <FeatureGridBlock data={block} theme={theme} />;
    case "footer":
      return <FooterBlock data={block} theme={theme} />;
    default:
      return assertNever(block);
  }
}

function assertNever(value: never): never {
  throw new Error(`BlockRenderer: unhandled block type ${JSON.stringify(value)}`);
}
