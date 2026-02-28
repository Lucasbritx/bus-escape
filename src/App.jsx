import { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas, { PARKING_ROWS, PASSENGER_ROWS } from './components/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import WinScreen from './components/WinScreen.jsx';
import { HAND_CRAFTED_LEVELS, getLevelData } from './game/levels.js';
import { generateLevel } from './game/levelGenerator.js';
import { slideVehicle, checkWin, COLS } from './game/gameEngine.js';
import { playSlide, playExit, playBlocked, playWin, playPark, playBoard } from './game/sounds.js';

const ANIM_DURATION  = 280;  // ms – must match GameCanvas constant
const EXIT_EXTRA     = 140;  // ms for off-screen fade (exits)
const PARK_EXTRA     = 112;  // ms for park fade-in

// ── Canvas width (responsive) ─────────────────────────────────────────────────
function getCanvasWidth() {
  return Math.min(window.innerWidth - 16, 420);
}

// ── Level loader ──────────────────────────────────────────────────────────────
function loadLevel(levelNumber) {
  if (levelNumber <= HAND_CRAFTED_LEVELS.length) {
    return getLevelData(HAND_CRAFTED_LEVELS[levelNumber - 1]);
  }
  const idx = levelNumber - HAND_CRAFTED_LEVELS.length - 1;
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
  const [canvasWidth, setCanvasWidth]     = useState(getCanvasWidth);
  const [levelNumber, setLevelNumber]     = useState(initialLevel);
  const [levelData, setLevelData]         = useState(() => loadLevel(initialLevel));
  const [vehicles, setVehicles]           = useState(() => loadLevel(initialLevel).vehicles);
  const [passengers, setPassengers]       = useState(() => loadLevel(initialLevel).passengers);
  const [parkingSpots, setParkingSpots]   = useState(() => loadLevel(initialLevel).parkingSpots);
  const [moves, setMoves]                 = useState(0);
  const [won, setWon]                     = useState(false);
  const [generating, setGenerating]       = useState(false);

  // Map<vehicleId, { startTime, fromDx, fromDy, isExit, isPark, exitDx, exitDy }>
  const [animations, setAnimations]       = useState(new Map());
  const animatingRef = useRef(false);

  // ── Responsive resize ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setCanvasWidth(getCanvasWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Load a level ──────────────────────────────────────────────────────────
  const startLevel = useCallback((num) => {
    setGenerating(true);
    setTimeout(() => {
      const data = loadLevel(num);
      setLevelNumber(num);
      saveLevel(num);
      setLevelData(data);
      setVehicles(data.vehicles);
      setPassengers(data.passengers);
      setParkingSpots(data.parkingSpots);
      setMoves(0);
      setWon(false);
      setAnimations(new Map());
      animatingRef.current = false;
      setGenerating(false);
    }, 10);
  }, []);

  const handleRestart   = useCallback(() => startLevel(levelNumber), [levelNumber, startLevel]);
  const handleNextLevel = useCallback(() => startLevel(levelNumber + 1), [levelNumber, startLevel]);

  // ── Tap handler ───────────────────────────────────────────────────────────
  const handleVehicleTap = useCallback(
    (vehicleId) => {
      if (animatingRef.current || won) return;

      const result = slideVehicle(vehicleId, vehicles, parkingSpots, passengers);
      if (!result.moved) {
        playBlocked();
        return;
      }

      animatingRef.current = true;

      const tappedVehicle = vehicles.find((v) => v.id === vehicleId);
      const cellSize = Math.floor(canvasWidth / COLS);

      const { steps, exited, parks } = result;
      const dirDelta = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
      const [dc, dr] = dirDelta[tappedVehicle.direction];

      const fromDx = -dc * steps * cellSize;
      const fromDy = -dr * steps * cellSize;

      // Exit: slide off screen
      const exitDx = exited ? dc * (cellSize * 3) : 0;
      const exitDy = exited ? dr * (cellSize * 3) : 0;

      // Park: continue sliding up into parking area then fade
      // The parking area is above the grid; for an up vehicle that parks,
      // we animate it continuing upward past row 0.
      const parkDy = parks ? -(cellSize * (PARKING_ROWS + 1)) : 0;

      const now = performance.now();
      const newAnim = new Map(animations);
      newAnim.set(vehicleId, {
        startTime: now,
        fromDx,
        fromDy,
        isExit: exited,
        isPark: parks,
        exitDx,
        exitDy: exited ? exitDy : parkDy,
      });

      setAnimations(newAnim);
      setVehicles(result.vehicles);
      setPassengers(result.passengers);
      setParkingSpots(result.parkingSpots);
      setMoves((m) => m + 1);

      // Sound
      if (parks) {
        playPark();
      } else if (exited) {
        playExit();
      } else {
        playSlide();
      }

      // Board sound fires slightly after park sound
      if (parks) {
        setTimeout(() => playBoard(), 160);
      }

      const totalTime = (exited || parks)
        ? ANIM_DURATION + (exited ? EXIT_EXTRA : PARK_EXTRA)
        : ANIM_DURATION;

      setTimeout(() => {
        setAnimations((prev) => {
          const next = new Map(prev);
          next.delete(vehicleId);
          return next;
        });
        animatingRef.current = false;

        if (checkWin(result.passengers)) {
          playWin();
          setWon(true);
        }
      }, totalTime + 30);
    },
    [vehicles, passengers, parkingSpots, won, animations, canvasWidth]
  );

  // ── Computed stats ────────────────────────────────────────────────────────
  const boardedCount = passengers.filter((p) => p.boarded).length;
  const totalCount   = passengers.length;

  // ── Canvas height ─────────────────────────────────────────────────────────
  const cellSize     = Math.floor(canvasWidth / COLS);
  const canvasHeight = Math.round(cellSize * PARKING_ROWS)
                     + Math.round(cellSize * PASSENGER_ROWS)
                     + cellSize * 9;

  return (
    <div className="app">
      <HUD
        levelLabel={levelData.label}
        moves={moves}
        boarded={boardedCount}
        total={totalCount}
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
            passengers={passengers}
            parkingSpots={parkingSpots}
            onVehicleTap={handleVehicleTap}
            animations={animations}
            width={canvasWidth}
          />
        )}
        {won && (
          <WinScreen
            levelLabel={levelData.label}
            moves={moves}
            boarded={boardedCount}
            total={totalCount}
            onNext={handleNextLevel}
            onRestart={handleRestart}
          />
        )}
      </div>

      <div className="footer">
        <p className="footer-hint">Tap a vehicle to move it — park the colored buses!</p>
      </div>
    </div>
  );
}
