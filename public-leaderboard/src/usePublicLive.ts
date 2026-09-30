import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { PublicLeaderboardSnapshot, PublicSprayCreatedPayload } from './types';

export type { PublicSprayCreatedPayload };

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

type Handlers = {
  onJoined: (snapshot: PublicLeaderboardSnapshot) => void;
  onSpray: (payload: PublicSprayCreatedPayload) => void;
  onLeaderboard: (snapshot: PublicLeaderboardSnapshot) => void;
  onRevoked?: (message: string) => void;
  onError?: (message: string) => void;
};

export function usePublicLive(token: string | undefined, handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io(`${SOCKET_URL}/live`, {
      transports: ['websocket', 'polling'],
      auth: { shareToken: token },
      query: { shareToken: token },
    });

    socket.on('public.leaderboard.joined', (snapshot: PublicLeaderboardSnapshot) => {
      handlersRef.current.onJoined(snapshot);
    });
    socket.on('public.spray.created', (payload: PublicSprayCreatedPayload) => {
      handlersRef.current.onSpray(payload);
    });
    socket.on('public.leaderboard.updated', (snapshot: PublicLeaderboardSnapshot) => {
      handlersRef.current.onLeaderboard(snapshot);
    });
    socket.on('public.leaderboard.revoked', (payload: { message?: string }) => {
      handlersRef.current.onRevoked?.(
        payload?.message || 'This leaderboard link is no longer available.',
      );
    });
    socket.on('error', (err: { message?: string }) => {
      handlersRef.current.onError?.(err?.message || 'Live connection error');
    });
    socket.on('connect_error', () => {
      handlersRef.current.onError?.('Unable to connect to live updates');
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);
}
