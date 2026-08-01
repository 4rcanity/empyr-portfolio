import type { Inbound, Outbound } from './protocol';

export type LinkStatus = 'idle' | 'dialing' | 'live' | 'lost';

interface LinkHandlers {
  onMessage: (message: Outbound) => void;
  onStatus: (status: LinkStatus) => void;
  onOpen: () => void;
}

/** Thin auto-reconnecting WebSocket wrapper around the HI/LO worker. */
export class TableLink {
  private socket: WebSocket | null = null;
  private retries = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(
    private readonly url: string,
    private readonly handlers: LinkHandlers,
  ) {}

  open() {
    if (this.disposed) return;
    this.handlers.onStatus(this.retries === 0 ? 'dialing' : 'lost');

    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.retries = 0;
      this.handlers.onStatus('live');
      this.handlers.onOpen();
    });

    socket.addEventListener('message', (event) => {
      try {
        this.handlers.onMessage(JSON.parse(String(event.data)) as Outbound);
      } catch {
        /* ignore malformed frames */
      }
    });

    const retry = () => {
      if (this.disposed || this.socket !== socket) return;
      this.socket = null;
      this.handlers.onStatus('lost');
      const wait = Math.min(8000, 600 * 2 ** this.retries++);
      this.timer = setTimeout(() => this.open(), wait);
    };

    socket.addEventListener('close', retry);
    socket.addEventListener('error', () => socket.close());
  }

  send(message: Inbound) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  dispose() {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    this.socket?.close();
    this.socket = null;
  }
}

export function tableUrl(host: string, code: string): string {
  const secure = !/^localhost|^127\.0\.0\.1|^\[::1\]/.test(host);
  return `${secure ? 'wss' : 'ws'}://${host}/room/${encodeURIComponent(code)}/socket`;
}

const KEY_STORE = 'hilo.player.key';

export function playerKey(): string {
  try {
    const found = sessionStorage.getItem(KEY_STORE);
    if (found) return found;
    const fresh =
      globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 20) ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(KEY_STORE, fresh);
    return fresh;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
