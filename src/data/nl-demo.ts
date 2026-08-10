import type { LocalizedContent, SiteConfig } from '../types/site-config';

/**
 * Pitch demos written in Dutch only — they are shown to Rotterdam shop owners,
 * so authoring an English translation would be dead weight. The site types
 * expect every language, so `toSiteConfig` fills the gap at the boundary while
 * the config files stay single-language.
 */
export type NlDemoConfig = Omit<SiteConfig, 'content'> & {
  content: { nl: LocalizedContent };
};

export function toSiteConfig(demo: NlDemoConfig): SiteConfig {
  return {
    ...demo,
    singleLang: true,
    content: { nl: demo.content.nl, en: demo.content.nl },
  };
}
