/**
 * Copy and intent matching for the portfolio help widget.
 *
 * Handoff goes to `server/help` (Cloudflare Worker → Web3Forms →
 * business@empyr-portfolio.com). The static GitHub Pages site never sees the
 * access key; it only posts to PUBLIC_HELP_HOST.
 */
import type { Lang } from '../i18n/ui';

export const HELP_HANDOFF_TO = 'business@empyr-portfolio.com';
export const HELP_WHATSAPP = 'https://wa.me/31638269872';
export const HELP_FALLBACK_HOST = 'empyr-help.arcanearthenden.workers.dev';
export const HELP_DEV_HOST = 'localhost:8790';

export type HelpIntent =
  | 'what_we_do'
  | 'pricing'
  | 'turnaround'
  | 'buy'
  | 'apps'
  | 'jobs'
  | 'languages'
  | 'contact'
  | 'human';

export interface HelpLink {
  href: string;
  label: string;
}

export interface HelpMessage {
  role: 'user' | 'bot';
  text: string;
}

export interface HelpStrings {
  launcher: string;
  close: string;
  title: string;
  greeting: string;
  placeholder: string;
  emailPlaceholder: string;
  send: string;
  sending: string;
  chips: { label: string; intent: HelpIntent }[];
  replies: Record<HelpIntent, { text: string; links?: HelpLink[] }>;
  greetBack: string;
  thanks: string;
  unknownOnce: string;
  unknownTwice: string;
  emailPrompt: string;
  emailInvalid: string;
  emailCancel: string;
  handoffThanks: string;
  handoffFail: string;
  alreadyHandedOff: string;
  transcriptYou: string;
  transcriptBot: string;
}

const links = (lang: Lang) => ({
  websites: `/${lang}/websites`,
  products: `/${lang}/products`,
  apps: `/${lang}/apps`,
  pricing: `/${lang}/pricing`,
  home: `/${lang}/`,
});

export function getHelpStrings(lang: Lang): HelpStrings {
  const l = links(lang);
  if (lang === 'nl') {
    return {
      launcher: 'Hulp',
      close: 'Sluit hulp',
      title: 'Hulp van Empyr Studios',
      greeting:
        'Hoi — ik beantwoord de gewone vragen over Empyr Studios. Wat we maken, tarieven, hoe lang het duurt. Als je met iemand van de studio wilt praten, zeg dat dan.',
      placeholder: 'Typ een vraag…',
      emailPlaceholder: 'jouw@email.nl',
      send: 'Stuur',
      sending: 'Versturen…',
      chips: [
        { label: 'Wat doen jullie?', intent: 'what_we_do' },
        { label: 'Prijzen', intent: 'pricing' },
        { label: 'Hoe snel live?', intent: 'turnaround' },
        { label: 'Een site overnemen', intent: 'buy' },
      ],
      replies: {
        what_we_do: {
          text: 'Kleine studio. We bouwen snelle sites voor lokale zaken: restaurants, garages, winkels, salons. Plus een paar eigen apps en games. Meestal binnen een week live. Geen twintigkoppig agency — open een demo als je wilt zien hoe het eruitziet.',
          links: [
            { href: l.websites, label: 'Websites' },
            { href: l.apps, label: 'Apps' },
          ],
        },
        pricing: {
          text: 'Een statische site begint bij €1.200. Daarna vink je aan wat je nodig hebt — extra taal, reserveren, enzovoort. Alles staat op de tarievenpagina, excl. btw. Definitief na een korte intake.',
          links: [{ href: l.pricing, label: 'Naar tarieven' }],
        },
        turnaround: {
          text: 'Voor een gewone zaak-site: meestal binnen een week live. Iets met accounts, bestellen of een heel platform duurt langer. Dat is geen belofte voor een app van drie maanden.',
        },
        buy: {
          text: 'Twee smaken. Een bestaande demo overnemen — naam, foto’s, teksten aanpassen — die staan onder Producten. Of iets nieuws laten bouwen. WhatsApp of mail is het begin: het nummer in de footer, of business@empyr-portfolio.com.',
          links: [
            { href: l.products, label: 'Producten' },
            { href: HELP_WHATSAPP, label: 'WhatsApp' },
          ],
        },
        apps: {
          text: 'CostPulse is van ons: een Windows-app die je abonnementen bijhoudt, lokaal op je pc, zonder account. Gratis te downloaden. Minigames staan apart.',
          links: [{ href: l.apps, label: 'Naar apps' }],
        },
        jobs: {
          text: 'De open rol is freelance sales, wereldwijd: jij sluit lokale zaken in hun taal, Empyr bouwt de site. €300 per gesloten klant, plus €1.000 bij 10 in een maand. Geen ervaring nodig. Staat op de homepage.',
          links: [{ href: `${l.home}#jobs`, label: 'Vacatures' }],
        },
        languages: {
          text: 'Deze site is Nederlands en Engels. Klantsites kunnen een extra taal krijgen — dat is een optie bij de tarieven, geen standaard belofte voor elk project.',
          links: [{ href: l.pricing, label: 'Tarieven' }],
        },
        contact: {
          text: 'Mail business@empyr-portfolio.com of WhatsApp via de link hieronder. Dat staat ook in de footer. Als je wilt dat iemand van de studio jóu terugschrijft, zeg dat hier — dan heb ik eerst je e-mail nodig.',
          links: [
            { href: 'mailto:business@empyr-portfolio.com', label: 'E-mail' },
            { href: HELP_WHATSAPP, label: 'WhatsApp' },
          ],
        },
        human: {
          text: 'Als je met iemand van Empyr Studios wilt praten, heb ik eerst een e-mailadres nodig. Zonder mail stuur ik niks door — anders kunnen we je niet terugschrijven.',
        },
      },
      greetBack: 'Hoi. Waar kan ik mee helpen?',
      thanks: 'Graag. Nog iets anders?',
      unknownOnce:
        'Dat staat niet in mijn lijst. Bedoel je wat we maken, de prijzen, hoe snel het gaat, of hoe je een site neemt?',
      unknownTwice:
        'Dat heb ik niet. Kies een van de onderwerpen hieronder, of zeg het als je met iemand van de studio wilt praten.',
      emailPrompt: 'Oké. Typ je e-mailadres. Zonder geldige mail stuur ik niks door.',
      emailInvalid:
        'Dat lijkt geen geldig e-mailadres. Iets als naam@zaak.nl — dan stuur ik dit gesprek naar de studio.',
      emailCancel: 'Oké, we blijven hier. Vraag maar.',
      handoffThanks:
        'Binnen. We hebben je e-mail en een samenvatting van dit gesprek naar business@empyr-portfolio.com gestuurd. Je hoort van ons op {email}.',
      handoffFail:
        'Kon de studio niet bereiken. Mail zelf naar business@empyr-portfolio.com en plak gerust wat je hier typte. Jouw adres is niet doorgezet.',
      alreadyHandedOff:
        'Dit gesprek is al doorgestuurd. Check je inbox, of mail business@empyr-portfolio.com als je iets wilt toevoegen.',
      transcriptYou: 'Jij',
      transcriptBot: 'Empyr',
    };
  }

  return {
    launcher: 'Help',
    close: 'Close help',
    title: 'Help from Empyr Studios',
    greeting:
      'Hi — I can answer the usual questions about Empyr Studios. What we make, prices, how long it takes. If you want to talk to someone at the studio, say so.',
    placeholder: 'Type a question…',
    emailPlaceholder: 'you@email.com',
    send: 'Send',
    sending: 'Sending…',
    chips: [
      { label: 'What do you do?', intent: 'what_we_do' },
      { label: 'Prices', intent: 'pricing' },
      { label: 'How fast?', intent: 'turnaround' },
      { label: 'Take over a site', intent: 'buy' },
    ],
    replies: {
      what_we_do: {
        text: 'Small studio. We build fast sites for local businesses: restaurants, garages, shops, salons. Plus a few of our own apps and games. Usually live in about a week. Not a twenty-person agency — open a demo if you want to see how it looks.',
        links: [
          { href: l.websites, label: 'Websites' },
          { href: l.apps, label: 'Apps' },
        ],
      },
      pricing: {
        text: 'A static site starts at €1,200. You add what you need from there — extra language, booking, and so on. Full list on the prices page, excl. tax. Final after a short intake.',
        links: [{ href: l.pricing, label: 'See prices' }],
      },
      turnaround: {
        text: 'For a normal shop site: usually live in about a week. Anything with accounts, ordering, or a full platform takes longer. That’s not a promise for a three-month app.',
      },
      buy: {
        text: 'Two routes. Take over an existing demo — name, photos, copy — those are under Products. Or have something new built. WhatsApp or email is the start: the number in the footer, or business@empyr-portfolio.com.',
        links: [
          { href: l.products, label: 'Products' },
          { href: HELP_WHATSAPP, label: 'WhatsApp' },
        ],
      },
      apps: {
        text: 'CostPulse is ours: a Windows app that tracks subscriptions, locally on your PC, no account. Free to download. Minigames live separately.',
        links: [{ href: l.apps, label: 'See apps' }],
      },
        jobs: {
          text: 'The open role is freelance sales, worldwide: you close local businesses in their language, Empyr builds the site. €300 per closed customer, plus €1.000 at 10 in a month. No experience needed. That’s on the home page.',
          links: [{ href: `${l.home}#jobs`, label: 'Open roles' }],
        },
      languages: {
        text: 'This site is Dutch and English. Client sites can get an extra language — that’s an option on the prices page, not a default for every job.',
        links: [{ href: l.pricing, label: 'Prices' }],
      },
      contact: {
        text: 'Email business@empyr-portfolio.com or WhatsApp via the link below. Same as the footer. If you want someone at the studio to write you back, say so here — I’ll need your email first.',
        links: [
          { href: 'mailto:business@empyr-portfolio.com', label: 'Email' },
          { href: HELP_WHATSAPP, label: 'WhatsApp' },
        ],
      },
      human: {
        text: 'If you want to talk to someone at Empyr Studios, I need an email address first. No email, nothing gets sent — otherwise we can’t write back.',
      },
    },
    greetBack: 'Hi. What can I help with?',
    thanks: 'You’re welcome. Anything else?',
    unknownOnce:
      'That’s not in my list. Do you mean what we make, prices, how fast it is, or how you take a site?',
    unknownTwice:
      'I don’t have that. Pick one of the topics below, or say so if you want to talk to someone at the studio.',
    emailPrompt: 'Okay. Type your email address. I won’t pass anything on without a valid one.',
    emailInvalid:
      'That doesn’t look like an email. Something like name@shop.com — then I’ll send this chat to the studio.',
    emailCancel: 'Okay, we’ll stay here. Ask away.',
    handoffThanks:
      'Sent. We emailed your address and a short recap of this chat to business@empyr-portfolio.com. We’ll reply to {email}.',
    handoffFail:
      'Couldn’t reach the studio. Email business@empyr-portfolio.com yourself and paste what you typed here. Your address was not forwarded.',
    alreadyHandedOff:
      'This chat was already forwarded. Check your inbox, or email business@empyr-portfolio.com if you want to add something.',
    transcriptYou: 'You',
    transcriptBot: 'Empyr',
  };
}

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/-/g, '')
    .replace(/[^a-z0-9\s+@.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Only true “talk to a person” asks — not WhatsApp-as-FAQ, not unknown misses. */
const HUMAN_RE =
  /\b(iemand spreken|spreken met|met iemand|real person|echte persoon|echte mens|een mens|call me|bel me|bel ons|\bbellen\b|doorverbinden|medewerker|adviseur|klantenservice|talk to (a )?(real )?person|talk to someone|live agent|human please|een persoon)\b/;

const INTENT_PATTERNS: { intent: Exclude<HelpIntent, 'human'>; re: RegExp }[] = [
  {
    intent: 'pricing',
    re: /\b(prijs|prijzen|tarief|tarieven|kosten|kost het|hoeveel|price|prices|pricing|cost|costs|how much|budget|offerte|quote)\b/,
  },
  {
    intent: 'turnaround',
    re: /\b(hoe lang|hoelang|hoe snel|binnen een week|oplevering|turnaround|how long|how fast|how soon|delivery|live when|wanneer live|tijd nodig)\b/,
  },
  {
    intent: 'buy',
    re: /\b(overnemen|te koop|kopen|bestellen|commission|opdracht|maatwerk|custom|take over|ready.?made|demo kopen|wil( ik)? een site|want a (site|website)|site laten maken|website laten)\b/,
  },
  {
    intent: 'contact',
    re: /\b(contact|bereiken|mailen|email|whatsapp|wa\.me|hoe kan ik jullie)\b/,
  },
  {
    intent: 'apps',
    re: /\b(costpulse|abonnementen.?app|windows.?app|jullie app)\b/,
  },
  {
    intent: 'jobs',
    re: /\b(vacature|vacatures|sollicit|hiring|werken bij|job|jobs|pitcher|werft|freelance sales|sales)\b/,
  },
  {
    intent: 'languages',
    re: /\b(meertal|talen|nederlands en engels|extra taal|multilingual|english and dutch|other language)\b/,
  },
  {
    intent: 'what_we_do',
    re: /\b(wat doen|wie zijn|what do you|who are you|wat is empyr|what is empyr|restaurant|garage|salon|kapsalon|winkel|local|lokale zaak|websites?|webshop)\b/,
  },
];

const GREET_RE = /^(hoi|hallo|hey|hi|hello|yo|goedemorgen|goedemiddag|goedenavond|good morning|good afternoon)\b/;
const THANKS_RE = /^(thanks|thank you|thx|ty|dank|dankje|dankjewel|bedankt|merci)\b/;
const CANCEL_RE =
  /\b(laat maar|nevermind|never mind|annuleer|cancel|stop|vergeet het|forget it|niet nodig)\b/;

export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (v.length < 6 || v.length > 254) return false;
  if (/\s/.test(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v);
}

export function isCancel(raw: string): boolean {
  return CANCEL_RE.test(fold(raw));
}

export function matchHelpTurn(
  raw: string,
): { kind: 'intent'; intent: HelpIntent } | { kind: 'greet' } | { kind: 'thanks' } | { kind: 'cancel' } | null {
  const text = fold(raw);
  if (!text) return null;
  if (CANCEL_RE.test(text)) return { kind: 'cancel' };
  if (GREET_RE.test(text) && text.split(' ').length <= 4) return { kind: 'greet' };
  if (THANKS_RE.test(text) && text.split(' ').length <= 5) return { kind: 'thanks' };
  if (HUMAN_RE.test(text)) return { kind: 'intent', intent: 'human' };
  for (const row of INTENT_PATTERNS) {
    if (row.re.test(text)) return { kind: 'intent', intent: row.intent };
  }
  return null;
}

export function formatTranscript(lines: HelpMessage[], strings: HelpStrings): string {
  return lines
    .map((line) => `${line.role === 'user' ? strings.transcriptYou : strings.transcriptBot}: ${line.text}`)
    .join('\n');
}

export function extractEmail(raw: string): string | null {
  const m = raw.match(/[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}/);
  if (!m) return null;
  return isValidEmail(m[0]) ? m[0].trim() : null;
}

export function helpWorkerUrl(path: string): string {
  const env = import.meta.env as unknown as Record<string, string | boolean | undefined>;
  const host =
    (typeof env.PUBLIC_HELP_HOST === 'string' && env.PUBLIC_HELP_HOST) ||
    (env.DEV ? HELP_DEV_HOST : HELP_FALLBACK_HOST);
  const protocol = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const prefix = path.startsWith('/') ? path : `/${path}`;
  return `${protocol}://${host}${prefix}`;
}
