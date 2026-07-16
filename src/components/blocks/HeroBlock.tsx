import type { HeroBlockData, ThemeTokens } from "@/types/layout";

interface HeroBlockProps {
  data: HeroBlockData;
  theme: ThemeTokens;
}

export default function HeroBlock({ data, theme }: HeroBlockProps) {
  const { eyebrow, headline, subheadline, primaryCta, secondaryCta, imageUrl } = data;

  return (
    <section
      className="relative isolate overflow-hidden px-6 py-24 sm:py-32"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: theme.fontBody,
      }}
    >
      {imageUrl ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
          }}
        />
      ) : null}

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle at 12% 18%, ${theme.accent}2e, transparent 55%)`,
        }}
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-6">
        {eyebrow ? (
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide"
            style={{ borderColor: theme.accent, color: theme.accent }}
          >
            {eyebrow}
          </span>
        ) : null}

        <h1
          className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
          style={{ fontFamily: theme.fontHeading, color: theme.text }}
        >
          {headline}
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl" style={{ color: theme.muted }}>
          {subheadline}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <a
            href={primaryCta.href}
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02]"
            style={{ backgroundColor: theme.accent, color: theme.onAccentText }}
          >
            {primaryCta.label}
          </a>

          {secondaryCta ? (
            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-lg border px-6 py-3 text-sm font-semibold transition-colors duration-150"
              style={{ borderColor: theme.muted, color: theme.text }}
            >
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
