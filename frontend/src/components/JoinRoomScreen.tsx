import { useState } from "react";

type Props = {
  roomCode: string;
  onJoin: (name: string) => void;
};

export function JoinRoomScreen({ roomCode, onJoin }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const join = () => {
    const playerName = name.trim();
    if (playerName.length < 2 || playerName.length > 20) {
      setError("Your name must be 2–20 characters.");
      return;
    }
    onJoin(playerName);
  };

  return (
    <main className="home-shell">
      <section className="home-card">
        <div className="brand-mark">
          GT<span>✳</span>
        </div>
        <p className="eyebrow">YOU WERE INVITED TO JOIN</p>
        <h1>
          Join the
          <br />
          <em>room.</em>
        </h1>
        <p className="intro">
          Room <strong>{roomCode}</strong> is waiting for you.
        </p>
        <label className="field-label" htmlFor="shared-room-name">
          YOUR NAME
        </label>
        <input
          autoFocus
          id="shared-room-name"
          className="text-input"
          maxLength={20}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") join();
          }}
          placeholder="e.g. Rahul"
          autoComplete="nickname"
        />
        <button className="button primary full" type="button" onClick={join}>
          JOIN ROOM <span>→</span>
        </button>
        {error && <p className="notice">{error}</p>}
      </section>
    </main>
  );
}
