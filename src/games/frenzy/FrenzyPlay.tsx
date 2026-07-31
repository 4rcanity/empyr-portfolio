import { useMemo } from 'react';
import FrenzyApp from './FrenzyApp';

interface Props {
  lang: 'nl' | 'en';
  host?: string;
  initialRoom?: string;
}

export default function FrenzyPlay({ lang, host, initialRoom = 'lobby' }: Props) {
  const roomId = useMemo(() => {
    if (typeof window === 'undefined') return initialRoom;
    const params = new URLSearchParams(window.location.search);
    const fromPath = window.location.pathname.match(/\/room\/([^/]+)\/?$/);
    const raw = params.get('room') || fromPath?.[1] || initialRoom;
    return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 16) || 'lobby';
  }, [initialRoom]);

  return <FrenzyApp lang={lang} roomId={roomId} host={host} />;
}
