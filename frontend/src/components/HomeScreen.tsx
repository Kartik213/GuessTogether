import { useState } from "react";

type Props = {
  initialName: string;
  error?: string;
  isCreating: boolean;
  onCreate: (name: string) => void;
  onJoin: (name: string, roomCode: string) => void;
};

export function HomeScreen({
  initialName,
  error,
  isCreating,
  onCreate,
  onJoin,
}: Props) {
  const [name, setName] = useState(initialName);
  const [roomCode, setRoomCode] = useState("");
  const validName = name.trim().length >= 2 && name.trim().length <= 20;
  return (
    <main className="home-shell">
      <div className="home-card">
        <div className="brand-mark">
          GT
        </div>
        <p className="eyebrow">THE FRIENDLY GUESSING GAME</p>
        <h1>
          Guess
          <br />
          <em>Together.</em>
        </h1>
        <p className="intro">Big questions. Bold guesses. Bragging rights.</p>
        <label className="field-label" htmlFor="player-name">
          YOUR NAME
        </label>
        <input
          id="player-name"
          className="text-input"
          maxLength={20}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Rahul"
          autoComplete="nickname"
        />
        <button
          className="button primary full"
          disabled={isCreating}
          onClick={() => onCreate(name)}
        >
          {isCreating ? "MAKING YOUR ROOM…" : "CREATE A ROOM"} <span>↗</span>
        </button>
        <div className="or">
          <i />
          or join a room
          <i />
        </div>
        <div className="join-row">
          <input
            aria-label="Room code"
            className="text-input code-input"
            maxLength={5}
            value={roomCode}
            onChange={(event) =>
              setRoomCode(
                event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
              )
            }
            placeholder="ROOM CODE"
          />
          <button
            className="button dark"
            disabled={!validName || !roomCode}
            onClick={() => onJoin(name, roomCode)}
          >
            JOIN
          </button>
        </div>
        {error && <p className="notice">{error}</p>}
        <p className="footnote">No accounts. Just friends and fun facts.</p>
      </div>
      <section className="landing-info" aria-label="About Guess Together">
        <p className="eyebrow">A FIVE-ROUND SOCIAL GAME</p>
        <h2>One question.<br />Everyone guesses.</h2>
        <p>
          Pick the closest number, score the most points, and earn the bragging
          rights before your friends do.
        </p>
        <div className="how-it-works">
          <span><b>01</b> Create a room</span>
          <span><b>02</b> Send the code</span>
          <span><b>03</b> Make your guesses</span>
        </div>
        <p className="builder-note">MADE FOR A GOOD-NATURED RIVALRY ✦</p>
      </section>
    </main>
  );
}
