import type { FooterBlockData, ThemeTokens } from "@/types/layout";

interface FooterBlockProps {
  data: FooterBlockData;
  theme: ThemeTokens;
}

export default function FooterBlock({ data, theme }: FooterBlockProps) {
  const { brandName, tagline, links, copyright } = data;

  return (
    <footer
      id="footer"
      className="px-6 py-12"
      style={{
        backgroundColor: theme.background,
        color: theme.muted,
        fontFamily: theme.fontBody,
        borderTop: `1px solid ${theme.muted}22`,
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-base font-semibold"
            style={{ fontFamily: theme.fontHeading, color: theme.text }}
          >
            {brandName}
          </p>

          {tagline ? (
            <p className="mt-1 text-sm" style={{ color: theme.muted }}>
              {tagline}
            </p>
          ) : null}
        </div>

        {links.length > 0 ? (
          <nav className="flex flex-wrap gap-6">
            {links.map((link, index) => (
              <a
                key={`${link.label}-${index}`}
                href={link.href}
                className="text-sm transition-colors duration-150 hover:underline"
                style={{ color: theme.muted }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>

      <p className="mx-auto mt-8 max-w-6xl text-xs" style={{ color: theme.muted }}>
        {copyright}
      </p>
    </footer>
  );
}
