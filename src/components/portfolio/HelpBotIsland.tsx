import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { Lang } from '../../i18n/ui';
import {
  extractEmail,
  formatTranscript,
  getHelpStrings,
  helpWorkerUrl,
  isCancel,
  matchHelpTurn,
  type HelpIntent,
  type HelpLink,
  type HelpMessage,
} from '../../data/help-bot';

interface Props {
  lang: Lang;
}

type Line = HelpMessage & { links?: HelpLink[] };

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function HelpBotIsland({ lang }: Props) {
  const strings = getHelpStrings(lang);
  const titleId = useId();
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const honeyRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<Line[]>([]);
  const [chips, setChips] = useState(strings.chips);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [handedOff, setHandedOff] = useState(false);
  const [unknownStreak, setUnknownStreak] = useState(0);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (log.length === 0) {
      setLog([{ role: 'bot', text: strings.greeting }]);
      setChips(strings.chips);
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
    // Seed greeting once when the panel first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when `open` flips
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.tabIndex !== -1 && !node.hasAttribute('disabled'),
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function closePanel() {
    setOpen(false);
    window.setTimeout(() => {
      (previousFocus.current ?? launcherRef.current)?.focus();
    }, 0);
  }

  function botLine(text: string, nextChips: typeof strings.chips = [], links?: HelpLink[]): Line[] {
    setChips(nextChips);
    return [{ role: 'bot', text, links }];
  }

  async function submitHandoff(email: string, messages: Line[]) {
    if (handedOff || sending) return;
    if (honeyRef.current?.value) return;
    setSending(true);
    const payloadMessages: HelpMessage[] = messages.map(({ role, text }) => ({ role, text }));
    let ok = false;
    try {
      const res = await fetch(helpWorkerUrl('/handoff'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email,
          lang,
          messages: payloadMessages,
          summary: formatTranscript(payloadMessages, strings),
          page: typeof location !== 'undefined' ? location.href : '',
        }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    setSending(false);
    if (ok) {
      setHandedOff(true);
      setAwaitingEmail(false);
      setLog([...messages, ...botLine(strings.handoffThanks.replace('{email}', email))]);
    } else {
      setAwaitingEmail(true);
      setLog([...messages, ...botLine(strings.handoffFail)]);
    }
    window.setTimeout(() => inputRef.current?.focus(), 20);
  }

  function takeUserText(raw: string, forced?: HelpIntent) {
    const text = raw.trim();
    if (!text || sending) return;
    const nextLog: Line[] = [...log, { role: 'user', text }];
    setDraft('');

    if (awaitingEmail && !forced) {
      if (isCancel(text)) {
        setAwaitingEmail(false);
        setUnknownStreak(0);
        setLog([...nextLog, ...botLine(strings.emailCancel, strings.chips)]);
        return;
      }
      const email = extractEmail(text);
      if (!email) {
        setLog([...nextLog, ...botLine(strings.emailInvalid)]);
        return;
      }
      setLog(nextLog);
      void submitHandoff(email, nextLog);
      return;
    }

    const turn = forced ? { kind: 'intent' as const, intent: forced } : matchHelpTurn(text);

    if (handedOff && turn?.kind === 'intent' && turn.intent === 'human') {
      setLog([...nextLog, ...botLine(strings.alreadyHandedOff)]);
      return;
    }

    if (!turn) {
      const streak = unknownStreak + 1;
      setUnknownStreak(streak);
      setLog([
        ...nextLog,
        ...botLine(streak >= 2 ? strings.unknownTwice : strings.unknownOnce, strings.chips),
      ]);
      return;
    }

    setUnknownStreak(0);
    if (turn.kind === 'greet') {
      setLog([...nextLog, ...botLine(strings.greetBack, strings.chips)]);
      return;
    }
    if (turn.kind === 'thanks') {
      setLog([...nextLog, ...botLine(strings.thanks, strings.chips)]);
      return;
    }
    if (turn.kind === 'cancel') {
      setAwaitingEmail(false);
      setLog([...nextLog, ...botLine(strings.emailCancel, strings.chips)]);
      return;
    }

    const reply = strings.replies[turn.intent];
    if (turn.intent === 'human') {
      setAwaitingEmail(true);
      setLog([...nextLog, ...botLine(reply.text)]);
      return;
    }
    setAwaitingEmail(false);
    setLog([...nextLog, ...botLine(reply.text, [], reply.links)]);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    takeUserText(draft);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          ref={panelRef}
          id="empyr-help-panel"
          role="dialog"
          aria-labelledby={titleId}
          aria-modal="true"
          className="pointer-events-auto flex w-[min(22rem,calc(100vw-1.75rem))] max-h-[min(34rem,calc(100dvh-6rem))] flex-col overflow-hidden rounded-[1.75rem] border border-(--line) bg-(--page-bg) shadow-2xl shadow-black/40"
        >
          <div className="flex items-center justify-between gap-3 border-b border-(--line) px-4 py-3">
            <div className="min-w-0">
              <p id={titleId} className="truncate text-sm font-bold text-(--heading)">
                {strings.title}
              </p>
              <p className="text-[11px] text-(--faint)">Empyr Studios</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--line) text-(--muted) transition hover:text-(--heading)"
              aria-label={strings.close}
              onClick={closePanel}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div
            ref={logRef}
            className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3"
            aria-live="polite"
            aria-relevant="additions"
          >
            {log.map((line, index) => (
              <div key={`${line.role}-${index}`} className={line.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    line.role === 'user'
                      ? 'max-w-[90%] rounded-2xl rounded-br-md bg-orange-500 px-3.5 py-2.5 text-sm leading-6 text-white'
                      : 'max-w-[90%] rounded-2xl rounded-bl-md border border-(--line) bg-(--card) px-3.5 py-2.5 text-sm leading-6 text-(--heading)'
                  }
                >
                  <p>{line.text}</p>
                  {line.links && line.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {line.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="rounded-full border border-(--line) bg-(--page-bg) px-3 py-1 text-xs font-semibold text-(--heading) underline-offset-2 hover:underline"
                          {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {chips.map((chip) => (
                <button
                  key={chip.intent}
                  type="button"
                  disabled={sending}
                  className="rounded-full border border-(--line) bg-(--card) px-3 py-1.5 text-xs font-semibold text-(--heading) transition hover:border-orange-400/50 hover:text-orange-300 disabled:opacity-50"
                  onClick={() => takeUserText(chip.label, chip.intent)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <form className="relative border-t border-(--line) p-3" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor={inputId}>
              {awaitingEmail ? strings.emailPlaceholder : strings.placeholder}
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id={inputId}
                type={awaitingEmail ? 'email' : 'text'}
                autoComplete={awaitingEmail ? 'email' : 'off'}
                maxLength={400}
                placeholder={awaitingEmail ? strings.emailPlaceholder : strings.placeholder}
                value={draft}
                disabled={sending}
                onChange={(event) => setDraft(event.target.value)}
                className="min-w-0 flex-1 rounded-full border border-(--line) bg-(--card) px-4 py-2.5 text-sm text-(--heading) outline-none placeholder:text-(--faint) focus:border-orange-400/60"
              />
              <input
                ref={honeyRef}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                name="company_url"
              />
              <button
                type="submit"
                disabled={sending}
                className="shrink-0 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:opacity-60"
              >
                {sending ? strings.sending : strings.send}
              </button>
            </div>
          </form>
        </div>
      )}

      {!open && (
        <button
          ref={launcherRef}
          type="button"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-400"
          aria-expanded={open}
          aria-controls="empyr-help-panel"
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.2-.9L3 20l1.05-3.15A7.5 7.5 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {strings.launcher}
        </button>
      )}
    </div>
  );
}
