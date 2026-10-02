import type { RoomSnapshot } from "../types/game";
import { FaRegCopy } from "react-icons/fa";
import {
  MAX_PLAYERS,
  MAX_ROUND_SCORE,
  ROUND_DURATION_MS,
  TOTAL_ROUNDS,
} from "../../../shared/constants";

type Props = {
  room: RoomSnapshot;
  playerId: string;
  onCopyCode: () => void;
  onStart: () => void;
};

export function LobbyScreen({ room, playerId, onCopyCode, onStart }: Props) {
  const isHost = room.hostId === playerId;
  return (
    <section className="panel lobby-panel">
      <p className="eyebrow">YOUR ROOM IS READY</p>
      <h1>
        Bring your
        <br />
        <em>best guesses.</em>
      </h1>
      <div className="lobby-code">
        <div>
          <small>ROOM CODE</small>
          <strong>{room.code}</strong>
        </div>
        <button className="button outline" type="button" onClick={onCopyCode}>
          COPY CODE <FaRegCopy />
        </button>
      </div>
      <div className="players-head">
        <span>
          PLAYERS <b>{room.players.length}/{MAX_PLAYERS}</b>
        </span>
        <span>
          {room.players.filter((player) => player.connected).length} ONLINE
        </span>
      </div>
      <div className="player-grid">
        {room.players.map((player, index) => (
          <div className="player-tile" key={player.id}>
            <span className={`avatar avatar-${index % 5}`}>
              {player.name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              {player.name}
              {player.id === playerId ? " <you>" : ""}
            </span>
            {player.id === room.hostId ? (
              <b className="host-tag">HOST</b>
            ) : (
              <i className={player.connected ? "online" : ""} />
            )}
          </div>
        ))}
      </div>
      {isHost ? (
        <button className="button primary full start-button" onClick={onStart}>
          START THE GAME <span>↗</span>
        </button>
      ) : (
        <div className="waiting">
          <span className="pulse" />
          Waiting for the host to start…
        </div>
      )}
      <section className="room-rules" aria-label="Game rules">
        <p className="eyebrow">ROOM RULES</p>
        <div>
          <span>
            <b>{String(TOTAL_ROUNDS).padStart(2, "0")}</b> rounds
          </span>
          <span>
            <b>{ROUND_DURATION_MS / 1000}</b> seconds to guess
          </span>
          <span>
            <b>+{MAX_ROUND_SCORE}</b> closest guess bonus
          </span>
        </div>
        <p className="mini-note">
          The host starts and advances each round. Closest guess wins.
        </p>
      </section>
    </section>
  );
}
