import { useState } from "react";
import { ROUND_DURATION_MS, TOTAL_ROUNDS } from "../../../shared/constants";
import type { RoomSnapshot } from "../types/game";

type Props = {
  room: RoomSnapshot;
  seconds: number;
  submitted: boolean;
  onSubmit: (guess: string) => void;
};

export function RoundScreen({ room, seconds, submitted, onSubmit }: Props) {
  const [guess, setGuess] = useState("");
  const answered = room.players.filter((player) => player.submitted).length;
  const timeRemaining = Math.max(
    0,
    Math.min(100, (seconds / (ROUND_DURATION_MS / 1000)) * 100),
  );
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (guess.trim() && !submitted) onSubmit(guess);
  };
  return (
    <section className="panel round-panel">
      <div className="round-top">
        <div className="round-label">
          ROUND <strong>{room.round + 1}</strong>
          <span> / {TOTAL_ROUNDS}</span>
        </div>
        <div className={`timer ${seconds <= 5 ? "urgent" : ""}`}>
          <span>◷</span> {seconds}
          <small>SEC</small>
        </div>
      </div>
      <div
        className={`progress-track ${seconds <= 5 ? "urgent" : ""}`}
        aria-label={`${seconds} seconds remaining`}
      >
        <i style={{ width: `${timeRemaining}%` }} />
      </div>
      <p className="eyebrow question-kicker">MAKE YOUR ESTIMATE</p>
      <h1 className="question">{room.question?.question}</h1>
      <p className="unit-hint">
        Type your best guess
        {room.question?.unit ? ` in ${room.question.unit}` : ""}.
      </p>
      <form className="guess-form" onSubmit={submit}>
        <input
          className="guess-input"
          type="number"
          min="0"
          step="any"
          value={guess}
          disabled={submitted}
          onChange={(event) => setGuess(event.target.value)}
          placeholder="Your guess"
          autoFocus
        />
        <button
          className="button primary"
          disabled={submitted || !guess.trim()}
        >
          SUBMIT <span>↗</span>
        </button>
      </form>
      <div className="round-foot">
        <div className="answer-progress">
          <span className="tiny-avatars">
            {room.players.slice(0, 4).map((player) => (
              <i key={player.id} className={player.submitted ? "done" : ""}>
                {player.name.slice(0, 1)}
              </i>
            ))}
          </span>
          <span>
            {answered} of {room.players.length} answered
          </span>
        </div>
        {submitted && <span className="submitted-mark">✓ GUESS LOCKED IN</span>}
      </div>
    </section>
  );
}
