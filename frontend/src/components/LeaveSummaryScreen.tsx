type Props = { score: number; onHome: () => void };

export function LeaveSummaryScreen({ score, onHome }: Props) {
  return (
    <main className="home-shell">
      <section className="home-card leave-summary">
        <div className="brand-mark">
          GT<span>✳</span>
        </div>
        <p className="eyebrow">THANKS FOR PLAYING</p>
        <h1>
          You left
          <br />
          <em>the room.</em>
        </h1>
        <div className="leave-score">
          <span>YOUR FINAL SCORE</span>
          <strong>{score.toLocaleString()}</strong>
          <small>POINTS</small>
        </div>
        <button className="button primary full" onClick={onHome}>
          BACK HOME <span>↗</span>
        </button>
      </section>
    </main>
  );
}
