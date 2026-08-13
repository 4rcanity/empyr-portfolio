import {
  HELP_HANDOFF_ENDPOINT,
  formatTranscript,
  getHelpStrings,
  isCancel,
  isValidEmail,
  matchHelpTurn,
  type HelpIntent,
  type HelpLink,
  type HelpStrings,
} from '../../data/help-bot';
import type { Lang } from '../../i18n/ui';

interface LogLine {
  role: 'user' | 'bot';
  text: string;
}

function extractEmail(raw: string): string | null {
  const m = raw.match(/[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}/);
  if (!m) return null;
  return isValidEmail(m[0]) ? m[0].trim() : null;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function mountHelpBot(root: HTMLElement, lang: Lang): void {
  const strings: HelpStrings = getHelpStrings(lang);
  const panel = root.querySelector<HTMLElement>('[data-help-panel]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-help-toggle]');
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-help-close]');
  const logEl = root.querySelector<HTMLElement>('[data-help-log]');
  const form = root.querySelector<HTMLFormElement>('[data-help-form]');
  const input = root.querySelector<HTMLInputElement>('[data-help-input]');
  const honey = root.querySelector<HTMLInputElement>('[data-help-honey]');
  const chipsEl = root.querySelector<HTMLElement>('[data-help-chips]');
  const sendBtn = root.querySelector<HTMLButtonElement>('[data-help-send]');
  if (!panel || !toggle || !closeBtn || !logEl || !form || !input || !chipsEl || !sendBtn) return;

  const log: LogLine[] = [];
  let opened = false;
  let awaitingEmail = false;
  let handedOff = false;
  let unknownStreak = 0;
  let sending = false;
  let previousFocus: HTMLElement | null = null;

  function setOpen(next: boolean): void {
    opened = next;
    panel!.hidden = !next;
    toggle!.setAttribute('aria-expanded', String(next));
    toggle!.classList.toggle('hidden', next);
    if (next) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (log.length === 0) {
        pushBot(strings.greeting, strings.chips);
      }
      window.setTimeout(() => input!.focus(), 20);
    } else {
      previousFocus?.focus();
    }
  }

  function pushBot(text: string, chips?: HelpStrings['chips'], links?: HelpLink[]): void {
    log.push({ role: 'bot', text });
    const wrap = el('div', 'flex justify-start');
    const bubble = el(
      'div',
      'max-w-[90%] rounded-2xl rounded-bl-md border border-(--line) bg-(--card) px-3.5 py-2.5 text-sm leading-6 text-(--heading)',
    );
    bubble.textContent = text;
    if (links?.length) {
      const nav = el('div', 'mt-2 flex flex-wrap gap-2');
      for (const link of links) {
        const a = el('a', 'rounded-full border border-(--line) bg-(--page-bg) px-3 py-1 text-xs font-semibold text-(--heading) underline-offset-2 hover:underline', link.label);
        a.href = link.href;
        nav.append(a);
      }
      bubble.append(nav);
    }
    wrap.append(bubble);
    logEl!.append(wrap);
    renderChips(chips ?? []);
    logEl!.scrollTop = logEl!.scrollHeight;
  }

  function pushUser(text: string): void {
    log.push({ role: 'user', text });
    const wrap = el('div', 'flex justify-end');
    const bubble = el(
      'p',
      'max-w-[90%] rounded-2xl rounded-br-md bg-orange-500 px-3.5 py-2.5 text-sm leading-6 text-white',
      text,
    );
    wrap.append(bubble);
    logEl!.append(wrap);
    logEl!.scrollTop = logEl!.scrollHeight;
  }

  function renderChips(chips: HelpStrings['chips']): void {
    chipsEl!.replaceChildren();
    for (const chip of chips) {
      const btn = el(
        'button',
        'rounded-full border border-(--line) bg-(--card) px-3 py-1.5 text-xs font-semibold text-(--heading) transition hover:border-orange-400/50 hover:text-orange-300',
        chip.label,
      );
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (sending || handedOff) return;
        takeUserText(chip.label, chip.intent);
      });
      chipsEl!.append(btn);
    }
  }

  function setEmailMode(on: boolean): void {
    awaitingEmail = on;
    input!.type = on ? 'email' : 'text';
    input!.autocomplete = on ? 'email' : 'off';
    input!.placeholder = on ? strings.emailPlaceholder : strings.placeholder;
    input!.setAttribute('aria-label', on ? strings.emailPlaceholder : strings.placeholder);
  }

  function replyIntent(intent: HelpIntent): void {
    const reply = strings.replies[intent];
    if (intent === 'human') {
      if (handedOff) {
        pushBot(strings.alreadyHandedOff);
        setEmailMode(false);
        return;
      }
      setEmailMode(true);
      unknownStreak = 0;
      pushBot(reply.text);
      return;
    }
    setEmailMode(false);
    unknownStreak = 0;
    pushBot(reply.text, undefined, reply.links);
  }

  async function submitHandoff(email: string): Promise<void> {
    if (handedOff || sending) return;
    if (honey?.value) return;
    sending = true;
    sendBtn!.disabled = true;
    sendBtn!.textContent = strings.sending;
    input!.disabled = true;

    const transcript = formatTranscript(log, strings);
    const page = typeof location !== 'undefined' ? location.href : '';
    const payload = {
      _subject: `Empyr help chat — ${email}`,
      _template: 'box',
      _captcha: 'false',
      _honey: honey?.value ?? '',
      name: 'Portfolio help widget',
      email,
      language: lang,
      page,
      message: [
        `Visitor email: ${email}`,
        `Language: ${lang}`,
        `Page: ${page}`,
        '',
        'Transcript:',
        transcript,
      ].join('\n'),
    };

    let ok = false;
    try {
      const res = await fetch(HELP_HANDOFF_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const body = (await res.json().catch(() => null)) as { success?: string | boolean } | null;
        ok = body?.success === true || body?.success === 'true' || res.ok;
      }
    } catch {
      ok = false;
    }

    sending = false;
    sendBtn!.disabled = false;
    sendBtn!.textContent = strings.send;
    input!.disabled = false;

    if (ok) {
      handedOff = true;
      setEmailMode(false);
      pushBot(strings.handoffThanks.replace('{email}', email));
    } else {
      pushBot(strings.handoffFail);
      setEmailMode(true);
    }

    input!.focus();
  }

  function takeUserText(raw: string, forced?: HelpIntent): void {
    const text = raw.trim();
    if (!text || sending) return;
    pushUser(text);
    input!.value = '';
    renderChips([]);

    if (awaitingEmail && !forced) {
      if (isCancel(text)) {
        setEmailMode(false);
        unknownStreak = 0;
        pushBot(strings.emailCancel, strings.chips);
        return;
      }
      const email = extractEmail(text);
      if (!email) {
        pushBot(strings.emailInvalid);
        return;
      }
      void submitHandoff(email);
      return;
    }

    if (handedOff) {
      const turn = forced ? { kind: 'intent' as const, intent: forced } : matchHelpTurn(text);
      if (turn?.kind === 'intent' && turn.intent === 'human') {
        pushBot(strings.alreadyHandedOff);
        return;
      }
    }

    if (forced) {
      replyIntent(forced);
      return;
    }

    const turn = matchHelpTurn(text);
    if (!turn) {
      unknownStreak += 1;
      if (unknownStreak >= 2) {
        if (handedOff) {
          pushBot(strings.alreadyHandedOff);
          return;
        }
        setEmailMode(true);
        pushBot(strings.unknownTwice);
        return;
      }
      pushBot(strings.unknownOnce, strings.chips);
      return;
    }

    unknownStreak = 0;
    if (turn.kind === 'greet') {
      pushBot(strings.greetBack, strings.chips);
      return;
    }
    if (turn.kind === 'thanks') {
      pushBot(strings.thanks, strings.chips);
      return;
    }
    if (turn.kind === 'cancel') {
      setEmailMode(false);
      pushBot(strings.emailCancel, strings.chips);
      return;
    }
    replyIntent(turn.intent);
  }

  toggle.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    takeUserText(input.value);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && opened) {
      event.preventDefault();
      setOpen(false);
    }
  });
}
