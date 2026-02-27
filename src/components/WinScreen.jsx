export default function WinScreen({ levelLabel, moves, onNext, onRestart }) {
  // Star rating based on moves
  const getStars = () => {
    if (moves <= 5) return 3;
    if (moves <= 10) return 2;
    return 1;
  };
  const stars = getStars();

  return (
    <div className="win-overlay">
      <div className="win-card">
        <div className="win-emoji">🎉</div>
        <h2 className="win-title">{levelLabel} Complete!</h2>
        <div className="win-stars">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`win-star ${s <= stars ? 'win-star--filled' : 'win-star--empty'}`}>
              ★
            </span>
          ))}
        </div>
        <p className="win-moves">
          Completed in <strong>{moves}</strong> move{moves !== 1 ? 's' : ''}
        </p>
        <div className="win-actions">
          <button className="btn-next" onClick={onNext}>
            Next Level →
          </button>
          <button className="btn-replay" onClick={onRestart}>
            ↺ Replay
          </button>
        </div>
      </div>
    </div>
  );
}
