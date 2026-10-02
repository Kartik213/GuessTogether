import { Leaderboard } from "./Leaderboard";
import { TOTAL_ROUNDS } from "../../../shared/constants";
import type { RoomSnapshot } from "../types/game";

type Props = { room: RoomSnapshot; playerId: string; onNext: () => void };

export function ResultsScreen({ room, playerId, onNext }: Props) {
  const player = room.players.find((candidate) => candidate.id === playerId);
  const isHost = room.hostId === playerId;
  return (
    <section className="panel results-panel">
      <div className="result-banner">
        <span className="spark">✳</span>
        <p className="eyebrow">ROUND {room.round + 1} COMPLETE</p>
        <h1>
          The answer was
          <br />
          <em>
            {room.answer?.toLocaleString()} {room.question?.unit}
          </em>
        </h1>
        <p className="result-question">{room.question?.question}</p>
      </div>
      <div className="results-columns">
        <div className="your-result">
          <p className="eyebrow">YOUR GUESS</p>
          <strong>{player?.guess?.toLocaleString() ?? "No guess"}</strong>
          <span className="points">
            +{(player?.roundScore ?? 0).toLocaleString()} <small>POINTS</small>
          </span>
        </div>
        <div className="board-wrap">
          <div className="board-heading">
            LEADERBOARD <span>AFTER ROUND {room.round + 1}</span>
          </div>
          <Leaderboard players={room.players} currentPlayerId={playerId} />
        </div>
      </div>
      {isHost ? (
        <button className="button primary full start-button" onClick={onNext}>
          {room.round === TOTAL_ROUNDS - 1 ? "SEE FINAL RESULTS" : "NEXT ROUND"} <span>↗</span>
        </button>
      ) : (
        <div className="waiting">
          <span className="pulse" />
          Waiting for the host…
        </div>
      )}
    </section>
  );
}
