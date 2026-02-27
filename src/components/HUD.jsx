export default function HUD({ levelLabel, moves, onRestart }) {
  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-level">{levelLabel}</span>
      </div>
      <div className="hud-center">
        <span className="hud-title">Bus Escape</span>
      </div>
      <div className="hud-right">
        <span className="hud-moves">
          <span className="hud-moves-num">{moves}</span>
          <span className="hud-moves-label"> moves</span>
        </span>
        <button className="btn-restart" onClick={onRestart} title="Restart level">
          ↺
        </button>
      </div>
    </div>
  );
}
