import { Leaderboard } from "./Leaderboard";
import { TOTAL_ROUNDS } from "../../../shared/constants";
import type { RoomSnapshot } from "../types/game";
import { sortPlayers } from "../utils/players";

type Props = {
  room: RoomSnapshot;
  playerId: string;
  onReplay: () => void;
  onHome: () => void;
};

export function FinalScreen({ room, playerId, onReplay, onHome }: Props) {
  const winner = sortPlayers(room.players)[0];
  return (
    <section className="panel final-panel">
      <div className="final-heading">
        <div className="trophy">♛</div>
        <p className="eyebrow">THAT’S A WRAP</p>
        <h1>
          Game
          <br />
          <em>over.</em>
        </h1>
        <p className="winner-label">THE GUESSING CHAMPION</p>
        <strong className="winner-name">{winner?.name ?? "-"}</strong>
        <span className="winner-score">
          {(winner?.score ?? 0).toLocaleString()} POINTS
        </span>
      </div>
      <div className="board-wrap final-board">
        <div className="board-heading">
          FINAL LEADERBOARD <span>{TOTAL_ROUNDS} ROUNDS</span>
        </div>
        <Leaderboard
          players={room.players}
          currentPlayerId={playerId}
          showWinner
        />
      </div>
      <div className="final-actions">
        {room.hostId === playerId && (
          <button className="button primary" onClick={onReplay}>
            PLAY AGAIN ↗
          </button>
        )}
        <button className="button outline" type="button" onClick={onHome}>
          HOME
        </button>
      </div>
    </section>
  );
}
