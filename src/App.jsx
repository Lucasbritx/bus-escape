import { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import WinScreen from './components/WinScreen.jsx';
import { HAND_CRAFTED_LEVELS, getLevelData } from './game/levels.js';
import { generateLevel } from './game/levelGenerator.js';
import { slideVehicle, checkWin, buildGrid, computeSlideSteps, COLS } from './game/gameEngine.js';
import { playSlide, playExit, playBlocked, playWin } from './game/sounds.js';

const ANIM_DURATION = 280;   // ms – must match GameCanvas constant
const EXIT_EXTRA    = 140;   // ms for the off-screen fade portion

// ── Canvas width (responsive) ─────────────────────────────────────────────────
function getCanvasWidth() {
  return Math.min(window.innerWidth - 16, 420);
}

// ── Level loader ──────────────────────────────────────────────────────────────
function loadLevel(levelNumber) {
  // 1-indexed. Levels 1-3 = hand-crafted, 4+ = procedural.
  if (levelNumber <= HAND_CRAFTED_LEVELS.length) {
    return getLevelData(HAND_CRAFTED_LEVELS[levelNumber - 1]);
  }
  const idx = levelNumber - HAND_CRAFTED_LEVELS.length - 1; // 0-based for generator
  return generateLevel(idx);
}

const STORAGE_KEY = 'busEscape_level';

function getSavedLevel() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? Math.max(1, parseInt(v, 10)) : 1;
  } catch (_) {
    return 1;
  }
}

function saveLevel(num) {
  try { localStorage.setItem(STORAGE_KEY, String(num)); } catch (_) {}
}

export default function App() {
  const initialLevel = getSavedLevel();
  const [canvasWidth, setCanvasWidth] = useState(getCanvasWidth);
  const [levelNumber, setLevelNumber] = useState(initialLevel);
  const [levelData, setLevelData] = useState(() => loadLevel(initialLevel));
  const [vehicles, setVehicles] = useState(() => loadLevel(initialLevel).vehicles);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Map<vehicleId, { startTime, fromDx, fromDy, isExit, exitDx, exitDy }>
  const [animations, setAnimations] = useState(new Map());
  const animatingRef = useRef(false); // debounce taps during animation

  // ── Responsive resize ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setCanvasWidth(getCanvasWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Load a level ──────────────────────────────────────────────────────────
  const startLevel = useCallback((num) => {
    setGenerating(true);
    // Use setTimeout to let React render the "Generating…" state first
    setTimeout(() => {
      const data = loadLevel(num);
      setLevelNumber(num);
      saveLevel(num);
      setLevelData(data);
      setVehicles(data.vehicles.map((v) => ({ ...v, exited: false })));
      setMoves(0);
      setWon(false);
      setAnimations(new Map());
      animatingRef.current = false;
      setGenerating(false);
    }, 10);
  }, []);

  const handleRestart = useCallback(() => startLevel(levelNumber), [levelNumber, startLevel]);
  const handleNextLevel = useCallback(() => startLevel(levelNumber + 1), [levelNumber, startLevel]);

  // ── Tap handler ───────────────────────────────────────────────────────────
  const handleVehicleTap = useCallback(
    (vehicleId) => {
      if (animatingRef.current || won) return;

      // Compute slide
      const currentVehicles = vehicles; // closure is fine here
      const result = slideVehicle(vehicleId, currentVehicles);
      if (!result.moved) {
        playBlocked();
        return;
      }

      animatingRef.current = true;

      const tappedVehicle = currentVehicles.find((v) => v.id === vehicleId);
      const cellSize = Math.floor(canvasWidth / COLS);

      // Compute animation: vehicle starts from old position and moves to new
      // We store the "from" pixel offset (how far back we start)
      const { steps, exited } = result;
      const dirDelta = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
      const [dc, dr] = dirDelta[tappedVehicle.direction];

      // fromDx/fromDy = negative of where it moved to, so it starts visually at origin
      // and lerps to 0 (its new position)
      const fromDx = -dc * steps * cellSize;
      const fromDy = -dr * steps * cellSize;

      // exitDx/exitDy = extra off-screen movement after reaching new position
      const exitDx = exited ? dc * (cellSize * 3) : 0;
      const exitDy = exited ? dr * (cellSize * 3) : 0;

      const now = performance.now();
      const newAnim = new Map(animations);
      newAnim.set(vehicleId, { startTime: now, fromDx, fromDy, isExit: exited, exitDx, exitDy });

      setAnimations(newAnim);
      setVehicles(result.vehicles);
      setMoves((m) => m + 1);

      // Play slide or exit sound immediately on tap
      if (result.exited) {
        playExit();
      } else {
        playSlide();
      }

      // Total animation time
      const totalTime = exited ? ANIM_DURATION + EXIT_EXTRA : ANIM_DURATION;

      setTimeout(() => {
        setAnimations((prev) => {
          const next = new Map(prev);
          next.delete(vehicleId);
          return next;
        });
        animatingRef.current = false;

        // Check win after animation completes
        if (checkWin(result.vehicles)) {
          playWin();
          setWon(true);
        }
      }, totalTime + 30);
    },
    [vehicles, won, animations, canvasWidth]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const cellSize = Math.floor(canvasWidth / COLS);
  const canvasHeight = cellSize * 9; // ROWS = 9

  return (
    <div className="app">
      <HUD
        levelLabel={levelData.label}
        moves={moves}
        onRestart={handleRestart}
      />

      <div className="canvas-wrapper" style={{ width: canvasWidth, height: canvasHeight }}>
        {generating ? (
          <div className="generating">
            <div className="generating-spinner" />
            <p>Generating puzzle…</p>
          </div>
        ) : (
          <GameCanvas
            vehicles={vehicles}
            onVehicleTap={handleVehicleTap}
            animations={animations}
            width={canvasWidth}
          />
        )}
        {won && (
          <WinScreen
            levelLabel={levelData.label}
            moves={moves}
            onNext={handleNextLevel}
            onRestart={handleRestart}
          />
        )}
      </div>

      <div className="footer">
        <p className="footer-hint">Tap a vehicle to slide it out!</p>
      </div>
    </div>
  );
}
