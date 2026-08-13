/**
 * Copy and intent matching for the portfolio help widget.
 *
 * Handoff: GitHub Pages is static (see DEPLOY.md). Game servers under
 * `server/` are Cloudflare Workers for minigames, not mail. Visitor messages
 * that need a human go to FormSubmit.co’s AJAX endpoint, which emails
 * business@empyr-portfolio.com — no secrets, no paid npm deps.
 */
import type { Lang } from '../i18n/ui';

export const HELP_HANDOFF_TO = 'business@empyr-portfolio.com';
export const HELP_HANDOFF_ENDPOINT = `https://formsubmit.co/ajax/${HELP_HANDOFF_TO}`;

export type HelpIntent =
  | 'what_we_do'
  | 'pricing'
  | 'turnaround'
  | 'buy'
  | 'apps'
  | 'jobs'
  | 'languages'
  | 'human';

export interface HelpLink {
  href: string;
  label: string;
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
        'Hoi — ik beantwoord de gewone vragen over Empyr Studios. Wat we maken, hoe een site werkt, hoe lang het duurt. Als ik het niet weet, kan ik het doorzetten naar de studio. Daarvoor heb ik wél je e-mail nodig.',
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
          text: 'Kleine studio. We bouwen snelle sites voor lokale zaken: restaurants, garages, winkels, salons. Plus een paar eigen apps, zoals CostPulse. Geen twintigkoppig agency — open een demo als je wilt zien hoe het eruitziet.',
          links: [
            { href: l.websites, label: 'Websites' },
            { href: l.apps, label: 'Apps' },
          ],
        },
        pricing: {
          text: 'De bedragen staan op de tarievenpagina. Je kiest websites, apps, Roblox of muziek en vinkt aan wat je nodig hebt. Excl. btw; definitief na een korte intake. Ik noem hier geen losse prijzen — die horen bij die lijst.',
          links: [{ href: l.pricing, label: 'Naar tarieven' }],
        },
        turnaround: {
          text: 'Voor een gewone zaak-site: meestal binnen een week live. Iets met accounts, bestellen of een heel platform duurt langer. Dat is geen belofte voor een app van drie maanden.',
        },
        buy: {
          text: 'Twee smaken. Een bestaande demo overnemen — naam, foto’s, teksten aanpassen — die staan onder Producten. Of iets nieuws laten bouwen. We beginnen met wat je zaak doet, niet met een briefing van veertig pagina’s.',
          links: [
            { href: l.products, label: 'Producten' },
            { href: l.websites, label: 'Alle demo’s' },
          ],
        },
        apps: {
          text: 'CostPulse is van ons: een Windows-app die je abonnementen bijhoudt, lokaal op je pc, zonder account. Gratis te downloaden.',
          links: [{ href: l.apps, label: 'Naar apps' }],
        },
        jobs: {
          text: 'Soms zoeken we designers, app-bouwers en mensen die lokale zaken benaderen. Dat staat onderaan de homepage. Als je wilt solliciteren, heb ik je e-mail nodig — dan zetten we het door.',
          links: [{ href: `${l.home}#jobs`, label: 'Vacatures' }],
        },
        languages: {
          text: 'Deze site is Nederlands en Engels. Klantsites kunnen een extra taal krijgen — dat is een optie bij de tarieven, geen standaard belofte voor elk project.',
          links: [{ href: l.pricing, label: 'Tarieven' }],
        },
        human: {
          text: 'Als je met iemand van Empyr Studios wilt praten, heb ik eerst een e-mailadres nodig. Zonder mail geen doorverbinding — anders kunnen we je niet terugschrijven.',
        },
      },
      greetBack: 'Hoi. Waar kan ik mee helpen?',
      thanks: 'Graag. Nog iets anders?',
      unknownOnce:
        'Dat staat niet in mijn lijst. Bedoel je wat we maken, de prijzen, hoe snel het gaat, of hoe je een site neemt?',
      unknownTwice:
        'Dat weet ik zo niet. Als je met iemand van de studio wilt praten, typ je e-mailadres — dan stuur ik dit gesprek door. Zonder e-mail geen doorverbinding.',
      emailPrompt:
        'Oké. Typ je e-mailadres. Zonder geldige mail stuur ik niks door.',
      emailInvalid:
        'Dat lijkt geen geldig e-mailadres. Iets als naam@zaak.nl — dan stuur ik dit gesprek naar de studio.',
      emailCancel: 'Oké, we blijven hier. Vraag maar.',
      handoffThanks:
        'Binnen. We hebben je e-mail en een samenvatting van dit gesprek naar business@empyr-portfolio.com gestuurd. Je hoort van ons op {email}.',
      handoffFail:
        'Versturen lukte niet. Mail zelf naar business@empyr-portfolio.com en plak gerust wat je hier typte. Jouw adres is niet doorgezet.',
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
      'Hi — I can answer the usual questions about Empyr Studios. What we make, how buying a site works, how long it takes. If I don’t know, I can pass it to the studio. I’ll need your email first.',
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
        text: 'Small studio. We build fast sites for local businesses: restaurants, garages, shops, salons. Plus a few of our own apps, like CostPulse. Not a twenty-person agency — skip the pitch deck and open a demo.',
        links: [
          { href: l.websites, label: 'Websites' },
          { href: l.apps, label: 'Apps' },
        ],
      },
      pricing: {
        text: 'The numbers are on the prices page. You pick websites, apps, Roblox or music and tick what you need. Excl. tax; final after a short intake. I won’t quote figures here — they belong on that list.',
        links: [{ href: l.pricing, label: 'See prices' }],
      },
      turnaround: {
        text: 'For a normal shop site: usually live in about a week. Anything with accounts, ordering, or a full platform takes longer. That’s not a promise for a three-month app.',
      },
      buy: {
        text: 'Two routes. Take over an existing demo — name, photos, copy — those are under Products. Or have something new built. We start with what your shop does, not a forty-page brief.',
        links: [
          { href: l.products, label: 'Products' },
          { href: l.websites, label: 'All demos' },
        ],
      },
      apps: {
        text: 'CostPulse is ours: a Windows app that tracks subscriptions, locally on your PC, no account. Free to download.',
        links: [{ href: l.apps, label: 'See apps' }],
      },
      jobs: {
        text: 'We sometimes hire designers, app builders, and people who talk to local shops. That’s at the bottom of the home page. If you want to apply, I need your email — then we’ll pass it on.',
        links: [{ href: `${l.home}#jobs`, label: 'Open roles' }],
      },
      languages: {
        text: 'This site is Dutch and English. Client sites can get an extra language — that’s an option on the prices page, not a default for every job.',
        links: [{ href: l.pricing, label: 'Prices' }],
      },
      human: {
        text: 'If you want to talk to someone at Empyr Studios, I need an email address first. No email, no handoff — otherwise we can’t write back.',
      },
    },
    greetBack: 'Hi. What can I help with?',
    thanks: 'You’re welcome. Anything else?',
    unknownOnce:
      'That’s not in my list. Do you mean what we make, prices, how fast it is, or how you take a site?',
    unknownTwice:
      'I don’t have that. If you want someone at the studio, type your email — I’ll send this chat along. No email, no handoff.',
    emailPrompt: 'Okay. Type your email address. I won’t pass anything on without a valid one.',
    emailInvalid:
      'That doesn’t look like an email. Something like name@shop.com — then I’ll send this chat to the studio.',
    emailCancel: 'Okay, we’ll stay here. Ask away.',
    handoffThanks:
      'Sent. We emailed your address and a short recap of this chat to business@empyr-portfolio.com. We’ll reply to {email}.',
    handoffFail:
      'Sending failed. Email business@empyr-portfolio.com yourself and paste what you typed here. Your address was not forwarded.',
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
    .replace(/[^a-z0-9\s+@.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const HUMAN_RE =
  /\b(iemand|persoon|human|medewerker|adviseur|bellen|bel me|bel ons|call me|phone|whatsapp|discord|doorverbinden|doorspelen|echte mens|real person|talk to (a |someone|you)|spreken met|spreek ik|klantenservice|contactpersoon|een mens|live chat|agent|solliciteren|sollicitatie|want to apply|i want to apply)\b/;

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
    intent: 'apps',
    re: /\b(costpulse|abonnementen.?app|windows.?app|jullie app)\b/,
  },
  {
    intent: 'jobs',
    re: /\b(vacature|vacatures|hiring|werken bij|job|jobs|pitcher|werft)\b/,
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

export function formatTranscript(
  lines: { role: 'user' | 'bot'; text: string }[],
  strings: HelpStrings,
): string {
  return lines
    .map((line) => `${line.role === 'user' ? strings.transcriptYou : strings.transcriptBot}: ${line.text}`)
    .join('\n');
}
