export function RejoiningScreen({ roomCode }: { roomCode: string }) {
  return (
    <main className="home-shell">
      <div className="home-card">
        <div className="brand-mark">
          GT<span>✳</span>
        </div>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>
          Rejoining
          <br />
          <em>your room…</em>
        </h1>
        <p className="intro">Restoring your place in room {roomCode}.</p>
      </div>
    </main>
  );
}
