import type { FeatureGridBlockData, ThemeTokens } from "@/types/layout";

interface FeatureGridBlockProps {
  data: FeatureGridBlockData;
  theme: ThemeTokens;
}

export default function FeatureGridBlock({ data, theme }: FeatureGridBlockProps) {
  const { heading, subheading, features } = data;

  return (
    <section
      id="features"
      className="px-6 py-20 sm:py-28"
      style={{ backgroundColor: theme.surface, color: theme.text, fontFamily: theme.fontBody }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ fontFamily: theme.fontHeading, color: theme.text }}
          >
            {heading}
          </h2>

          {subheading ? (
            <p className="mt-4 text-lg" style={{ color: theme.muted }}>
              {subheading}
            </p>
          ) : null}
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={`${feature.title}-${index}`}
              className="flex flex-col gap-3 border-t pt-6"
              style={{ borderColor: `${theme.muted}33` }}
            >
              {feature.icon ? (
                <span
                  aria-hidden="true"
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: theme.accent }}
                >
                  {feature.icon}
                </span>
              ) : null}

              <h3
                className="text-lg font-semibold"
                style={{ fontFamily: theme.fontHeading, color: theme.text }}
              >
                {feature.title}
              </h3>

              <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
