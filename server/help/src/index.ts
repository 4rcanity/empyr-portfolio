/**
 * Tiny mail pipe for the portfolio help widget.
 *
 * GitHub Pages cannot send email. This worker accepts a POST from the site,
 * checks the visitor email, and forwards a transcript through Web3Forms to
 * business@empyr.studio. The access key stays on the worker.
 */

export interface Env {
  WEB3FORMS_ACCESS_KEY?: string;
}

const BUSINESS = 'business@empyr.studio';
const WEB3FORMS = 'https://api.web3forms.com/submit';
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const MAX_MESSAGES = 50;
const MAX_TEXT = 2000;

const hits = new Map<string, number[]>();

function corsOrigin(origin: string | null): string | null {
  if (!origin) return null;
  if (
    origin === 'https://empyr.studio' ||
    origin === 'https://www.empyr.studio' ||
    origin === 'https://empyr-portfolio.com' ||
    origin === 'https://www.empyr-portfolio.com'
  ) {
    return origin;
  }
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return origin;
  } catch {
    return null;
  }
  return null;
}

function corsHeaders(origin: string | null): HeadersInit {
  const allow = corsOrigin(origin) ?? 'https://empyr.studio';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data: unknown, status: number, origin: string | null): Response {
  return Response.json(data, { status, headers: corsHeaders(origin) });
}

function validEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length < 6 || v.length > 254 || /\s/.test(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v);
}

function limited(ip: string): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (prev.length >= MAX_HITS) {
    hits.set(ip, prev);
    return true;
  }
  prev.push(now);
  hits.set(ip, prev);
  return false;
}

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
}

interface IncomingMessage {
  role: string;
  text: string;
}

interface IncomingBody {
  email?: unknown;
  lang?: unknown;
  messages?: unknown;
  summary?: unknown;
  page?: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return json({ ok: true, service: 'empyr-help' }, 200, origin);
    }

    if (request.method !== 'POST' || url.pathname !== '/handoff') {
      return json({ error: 'not_found' }, 404, origin);
    }

    if (!corsOrigin(origin) && origin) {
      return json({ error: 'origin_not_allowed' }, 403, origin);
    }

    if (limited(clientIp(request))) {
      return json({ error: 'rate_limited' }, 429, origin);
    }

    const key = env.WEB3FORMS_ACCESS_KEY?.trim();
    if (!key) {
      return json(
        { error: 'mail_unconfigured', hint: 'Set WEB3FORMS_ACCESS_KEY on the worker, then email business@empyr.studio.' },
        503,
        origin,
      );
    }

    let body: IncomingBody;
    try {
      body = (await request.json()) as IncomingBody;
    } catch {
      return json({ error: 'invalid_json' }, 400, origin);
    }

    if (!validEmail(body.email)) {
      return json({ error: 'invalid_email' }, 400, origin);
    }

    const lang = body.lang === 'en' ? 'en' : body.lang === 'nl' ? 'nl' : null;
    if (!lang) {
      return json({ error: 'invalid_lang' }, 400, origin);
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
      return json({ error: 'invalid_messages' }, 400, origin);
    }

    const messages: IncomingMessage[] = [];
    for (const raw of body.messages) {
      if (!raw || typeof raw !== 'object') {
        return json({ error: 'invalid_messages' }, 400, origin);
      }
      const row = raw as IncomingMessage;
      if ((row.role !== 'user' && row.role !== 'bot') || typeof row.text !== 'string') {
        return json({ error: 'invalid_messages' }, 400, origin);
      }
      const text = row.text.trim().slice(0, MAX_TEXT);
      if (!text) continue;
      messages.push({ role: row.role, text });
    }
    if (messages.length === 0) {
      return json({ error: 'invalid_messages' }, 400, origin);
    }

    const summary =
      typeof body.summary === 'string' && body.summary.trim()
        ? body.summary.trim().slice(0, 8000)
        : messages.map((m) => `${m.role}: ${m.text}`).join('\n');
    const page = typeof body.page === 'string' ? body.page.slice(0, 500) : '';

    const payload = {
      access_key: key,
      subject: `Empyr help chat — ${body.email}`,
      from_name: 'Empyr help widget',
      email: body.email,
      name: body.email,
      message: [
        `To: ${BUSINESS}`,
        `Visitor: ${body.email}`,
        `Language: ${lang}`,
        page ? `Page: ${page}` : null,
        '',
        summary,
      ]
        .filter(Boolean)
        .join('\n'),
    };

    let upstream: Response;
    try {
      upstream = await fetch(WEB3FORMS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      return json({ error: 'mail_upstream_failed' }, 502, origin);
    }

    if (!upstream.ok) {
      return json({ error: 'mail_upstream_failed' }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
  },
};
