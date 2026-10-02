import type { PlayerSnapshot } from "../types/game";
import { sortPlayers } from "../utils/players";

type Props = {
  players: PlayerSnapshot[];
  currentPlayerId: string;
  showWinner?: boolean;
};

export function Leaderboard({
  players,
  currentPlayerId,
  showWinner = false,
}: Props) {
  return (
    <div className="leaderboard">
      {sortPlayers(players).map((player, index) => (
        <div
          className={`leader-row ${player.id === currentPlayerId ? "you" : ""}`}
          key={player.id}
        >
          <span className="rank">{String(index + 1).padStart(2, "0")}</span>
          <span className="leader-name">
            {showWinner && index === 0 ? "♛ " : ""}
            {player.name}
            {player.id === currentPlayerId ? " (you)" : ""}
          </span>
          <span className="score">
            {player.score.toLocaleString()}
            <small> pts</small>
          </span>
        </div>
      ))}
    </div>
  );
}
