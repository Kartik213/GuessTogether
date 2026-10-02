import type { ReactNode } from "react";
import type { RoomSnapshot } from "../types/game";
import { FaRegCopy } from "react-icons/fa";

type Props = {
  room: RoomSnapshot;
  playerName: string;
  connectionStatus: "connecting" | "connected" | "disconnected";
  onCopyCode: () => void;
  onHome: () => void;
  onLeave: () => void;
  children: ReactNode;
};

export function AppShell({
  room,
  playerName,
  connectionStatus,
  onCopyCode,
  onHome,
  onLeave,
  children,
}: Props) {
  return (
    <main className="game-shell">
      <header className="topbar">
        <button className="wordmark" onClick={onHome}>
          guess<span>together</span>
          <b>✳</b>
        </button>
        <div className="room-pill">
          <span className={`connection-dot ${connectionStatus}`} />
          {connectionStatus === "connected"
            ? "LIVE"
            : "RECONNECTING"} <i /> ROOM <strong>{room.code}</strong>
          <button aria-label="Copy room code" onClick={onCopyCode}>
            <FaRegCopy />
          </button>
        </div>
        <div className="topbar-actions">
          <button className="leave-room" onClick={onLeave}>
            LEAVE ROOM
          </button>
          <div className="profile-chip">
            <span>{playerName.slice(0, 1).toUpperCase() || "G"}</span>
            {playerName}
          </div>
        </div>
      </header>
      {children}
      <footer className="game-footer">
        <span>
          GUESS TOGETHER <b>✳</b>
        </span>
        <span>MADE FOR GOOD COMPANY</span>
      </footer>
    </main>
  );
}
