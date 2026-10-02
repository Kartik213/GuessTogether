import { create } from "zustand";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
type ClientState = {
  playerId: string;
  playerName: string;
  roomCode: string | null;
  connectionStatus: ConnectionStatus;
  hasSubmitted: boolean;
  setName: (name: string) => void;
  setRoom: (roomCode: string | null) => void;
  setConnection: (status: ConnectionStatus) => void;
  setSubmitted: (value: boolean) => void;
};

function storedId() {
  let id = localStorage.getItem("guess-together-player-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("guess-together-player-id", id);
  }
  return id;
}

export const useGameStore = create<ClientState>((set) => ({
  playerId: storedId(),
  playerName: localStorage.getItem("guess-together-player-name") || "",
  roomCode: localStorage.getItem("guess-together-room-code"),
  connectionStatus: "disconnected",
  hasSubmitted: false,
  setName: (playerName) => {
    localStorage.setItem("guess-together-player-name", playerName);
    set({ playerName });
  },
  setRoom: (roomCode) => {
    if (roomCode) localStorage.setItem("guess-together-room-code", roomCode);
    else localStorage.removeItem("guess-together-room-code");
    set({ roomCode, hasSubmitted: false });
  },
  setConnection: (connectionStatus) => set({ connectionStatus }),
  setSubmitted: (hasSubmitted) => set({ hasSubmitted }),
}));
