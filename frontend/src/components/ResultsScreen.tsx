import { TOTAL_ROUNDS } from "../../../shared/constants";
import type { RoomSnapshot } from "../types/game";

type Props = { room: RoomSnapshot; playerId: string; onNext: () => void };

export function ResultsScreen({ room, playerId, onNext }: Props) {
  const isHost = room.hostId === playerId;
  const roundPlayers = [...room.players].sort(
    (left, right) => (right.roundScore ?? 0) - (left.roundScore ?? 0),
  );
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
      <div className="round-results">
        <div className="board-heading">
          ROUND RESULTS <span>AFTER ROUND {room.round + 1}</span>
        </div>
        <div className="result-table">
          <div className="board-heading">
            <span>PLAYER</span>
            <span>GUESS</span>
            <span>ROUND</span>
            <span>TOTAL</span>
          </div>
          {roundPlayers.map((roundPlayer) => (
            <div
              className={`round-result-row ${roundPlayer.id === playerId ? "you" : ""}`}
              key={roundPlayer.id}
            >
              <span className="result-player">
                {roundPlayer.name}
                {roundPlayer.id === playerId ? " (you)" : ""}
              </span>
              <strong className="result-guess">
                {roundPlayer.guess?.toLocaleString() ?? "No guess"}
              </strong>
              <span className="result-score">
                +{(roundPlayer.roundScore ?? 0).toLocaleString()}
              </span>
              <span className="result-total">
                {roundPlayer.score.toLocaleString()}
              </span>
            </div>
          ))}
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
