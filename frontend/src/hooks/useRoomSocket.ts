import { useEffect, useRef, useState } from "react";
import {
  SOCKET_RECONNECT_BASE_DELAY_MS,
  SOCKET_RECONNECT_MAX_DELAY_MS,
  SOCKET_RECONNECT_MAX_EXPONENT,
} from "../../../shared/constants";
import type { ClientAction, RoomSnapshot, ServerMessage } from "../types/game";

type Status = "connecting" | "connected" | "disconnected";

type Options = {
  roomCode: string | null;
  playerId: string;
  playerName: string;
  onState: (state: RoomSnapshot) => void;
  onError: (message: string) => void;
  onStatus: (status: Status) => void;
};

export function useRoomSocket({
  roomCode,
  playerId,
  playerName,
  onState,
  onError,
  onStatus,
}: Options) {
  const socket = useRef<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!roomCode) return;
    let active = true;
    let attempts = 0;
    let reconnectTimer = 0;

    const connect = () => {
      if (!active) return;
      onStatus("connecting");
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${location.host}/api/rooms/${roomCode}/ws?playerId=${encodeURIComponent(playerId)}&name=${encodeURIComponent(playerName)}`;
      const nextSocket = new WebSocket(url);
      socket.current = nextSocket;

      nextSocket.onopen = () => {
        attempts = 0;
        setIsReady(true);
        onStatus("connected");
      };
      nextSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          if (message.type === "state") onState(message.state);
          if (message.type === "error") onError(message.message);
        } catch {
          onError("Received an unreadable room update.");
        }
      };
      nextSocket.onerror = () =>
        active && onError("Connection interrupted. Reconnecting…");
      nextSocket.onclose = () => {
        if (!active) return;
        setIsReady(false);
        onStatus("disconnected");
        attempts += 1;
        reconnectTimer = window.setTimeout(
          connect,
          Math.min(
            SOCKET_RECONNECT_BASE_DELAY_MS *
              2 ** Math.min(attempts, SOCKET_RECONNECT_MAX_EXPONENT),
            SOCKET_RECONNECT_MAX_DELAY_MS,
          ),
        );
      };
    };

    connect();
    return () => {
      active = false;
      window.clearTimeout(reconnectTimer);
      socket.current?.close();
      socket.current = null;
      setIsReady(false);
      onStatus("disconnected");
    };
  }, [roomCode, playerId, playerName, onError, onState, onStatus]);

  const send = (action: ClientAction) => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      onError("You are disconnected. Reconnecting…");
      return false;
    }
    socket.current.send(JSON.stringify(action));
    return true;
  };

  return { send, isReady };
}
