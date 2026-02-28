export default function GameOverScreen({ levelLabel, moves, onRestart }) {
  return (
    <div className="gameover-overlay">
      <div className="gameover-card">
        <div className="gameover-emoji">😔</div>
        <h2 className="gameover-title">No Moves Left!</h2>
        <p className="gameover-subtitle">The buses are stuck</p>
        <p className="gameover-moves">
          <strong>{moves}</strong> move{moves !== 1 ? 's' : ''} made on {levelLabel}
        </p>
        <div className="gameover-actions">
          <button className="btn-next" onClick={onRestart}>
            ↺ Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
