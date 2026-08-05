import type { Env } from './room';

export { LiarsRoom } from './room';

const ROOM_ROUTE = /^\/room\/([a-z0-9-]{1,24})\/socket$/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return Response.json(
        { ok: true, game: "EMPYR LIAR'S BAR" },
        { headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }

    const match = url.pathname.match(ROOM_ROUTE);
    if (match) {
      const code = match[1].toLowerCase();
      const stub = env.LIARS_ROOM.get(env.LIARS_ROOM.idFromName(code));
      return stub.fetch(new Request(`${url.origin}/?code=${code}`, request));
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
