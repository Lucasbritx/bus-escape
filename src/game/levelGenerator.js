// ─── Procedural Level Generator ─────────────────────────────────────────────
// Generates BFS-guaranteed solvable levels using the new parking mechanic.
//
// Algorithm:
//  1. Pick 2-4 parking colors; assign them to random columns.
//  2. Place one parking vehicle (direction=up) per color, matching column.
//  3. Place blocker vehicles (down/left/right) to obstruct the parking lanes.
//  4. Build passenger list matching each parking vehicle's capacity.
//  5. BFS to verify all passengers can board (i.e., all parking vehicles can park).
//  6. Retry up to MAX_RETRIES on failure.

import {
  COLS, ROWS,
  buildGrid, computeSlideSteps, applySlide,
  checkWin, boardKey, cloneVehicles, clonePassengers, cloneParkingSpots,
  boardPassengers, VEHICLE_CAPACITY,
} from './gameEngine.js';
import { COLOR_KEYS } from './drawVehicle.js';

const DIRECTIONS_BLOCKER = ['down', 'left', 'right'];
const MAX_BFS_STATES = 20000;
const MAX_RETRIES    = 80;

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min, max) {
  return min + ((Math.random() * (max - min + 1)) | 0);
}

/**
 * Try to place a vehicle at anchor position going in direction.
 * Returns cells or null.
 */
function tryPlace(size, direction, anchorCol, anchorRow, occupied) {
  const isHoriz = direction === 'left' || direction === 'right';
  const cells = [];
  for (let i = 0; i < size; i++) {
    const nc = isHoriz ? anchorCol + i : anchorCol;
    const nr = isHoriz ? anchorRow     : anchorRow + i;
    if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return null;
    const key = `${nc},${nr}`;
    if (occupied.has(key)) return null;
    cells.push([nc, nr]);
  }
  return cells;
}

/**
 * Place a vehicle of given size/direction anywhere on grid (shuffled search).
 */
function findPlacement(size, direction, occupied, forbiddenCols = new Set()) {
  const isHoriz = direction === 'left' || direction === 'right';
  const positions = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isHoriz && forbiddenCols.has(c)) continue; // parking column — don't block upward path with vertical vehicle in same col
      positions.push([c, r]);
    }
  }
  shuffle(positions);

  for (const [c, r] of positions) {
    const cells = tryPlace(size, direction, c, r, occupied);
    if (cells) return cells;
  }
  return null;
}

// ── BFS Solver ────────────────────────────────────────────────────────────────

/**
 * BFS over (vehicles, passengers, parkingSpots) states.
 * Win = all passengers boarded.
 */
function isSolvable(initialVehicles, initialPassengers, initialParkingSpots) {
  const startKey = boardKey(initialVehicles, initialPassengers);
  const visited  = new Set([startKey]);
  // Queue items: [vehicles, passengers, parkingSpots]
  const queue    = [[initialVehicles, initialPassengers, initialParkingSpots]];

  while (queue.length > 0) {
    if (visited.size > MAX_BFS_STATES) return false;

    const [vehicles, passengers, parkingSpots] = queue.shift();

    if (checkWin(passengers)) return true;

    const grid = buildGrid(vehicles);

    for (const v of vehicles) {
      if (v.exited || v.parked) continue;

      const { steps, exits, parks, parkCol } = computeSlideSteps(v, grid, parkingSpots);
      if (steps === 0 && !exits && !parks) continue;

      const updatedV = applySlide(v, steps, exits, parks);
      const newVehicles = vehicles.map((sv) => (sv.id === v.id ? updatedV : sv));

      let newPassengers = passengers;
      let newParkingSpots = parkingSpots;

      if (parks && parkCol !== undefined) {
        newParkingSpots = parkingSpots.map((s, i) =>
          i === parkCol ? { ...s, occupiedBy: v.id } : s
        );
        newPassengers = boardPassengers(updatedV, passengers);
      }

      const key = boardKey(newVehicles, newPassengers);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push([newVehicles, newPassengers, newParkingSpots]);
      }
    }
  }

  return false;
}

// ── Level generation ──────────────────────────────────────────────────────────

function generateLevelAttempt(levelIndex) {
  // 1. Choose number of parking colors
  const numColors = randInt(
    Math.min(2, 2 + Math.floor(levelIndex / 2)),
    Math.min(4, 2 + Math.floor(levelIndex / 1.5))
  );

  // 2. Pick distinct colors and assign to distinct columns
  const allColors  = shuffle([...COLOR_KEYS]);
  const parkColors = allColors.slice(0, numColors);
  const allCols    = shuffle([0, 1, 2, 3, 4, 5, 6]);
  const parkCols   = allCols.slice(0, numColors);

  // 3. Build parking spots array
  const parkingSpots = Array(COLS).fill(null);
  for (let i = 0; i < numColors; i++) {
    parkingSpots[parkCols[i]] = { color: parkColors[i] };
  }

  const occupied = new Set();
  const vehicles = [];
  let vidx = 1;

  // 4. Place parking vehicles (up, must fit in assigned column)
  for (let i = 0; i < numColors; i++) {
    const col = parkCols[i];
    const color = parkColors[i];
    // Buses at higher levels
    const isBus = levelIndex >= 2 ? Math.random() < 0.5 : false;
    const size = isBus ? 3 : 2;

    // Place in column, leaving enough rows below for interesting blocking
    // Avoid rows 0-1 (so there's room for blockers above the vehicle)
    let placed = false;
    const rowStart = isBus ? 3 : 2;
    for (let r = ROWS - size; r >= rowStart; r--) {
      const cells = tryPlace(size, 'up', col, r, occupied);
      if (cells) {
        cells.forEach(([c, row]) => occupied.add(`${c},${row}`));
        vehicles.push({
          id: `v${vidx++}`,
          color,
          direction: 'up',
          cells,
          exited: false,
          parked: false,
        });
        placed = true;
        break;
      }
    }
    if (!placed) return null; // can't place parking vehicle
  }

  // 5. Place blocker vehicles
  const parkColSet = new Set(parkCols);
  const blockerCount = randInt(
    3 + Math.min(levelIndex * 2, 8),
    5 + Math.min(levelIndex * 3, 12)
  );

  for (let i = 0; i < blockerCount; i++) {
    const dir  = DIRECTIONS_BLOCKER[(Math.random() * DIRECTIONS_BLOCKER.length) | 0];
    const size = Math.random() < 0.35 ? 3 : 2;
    const cells = findPlacement(size, dir, occupied, parkColSet);
    if (!cells) continue;

    const color = allColors[(vidx - 1) % allColors.length];
    cells.forEach(([c, r]) => occupied.add(`${c},${r}`));
    vehicles.push({
      id: `v${vidx++}`,
      color,
      direction: dir,
      cells,
      exited: false,
      parked: false,
    });
  }

  // 6. Build passenger list
  const passengers = [];
  let pidx = 1;
  for (let i = 0; i < numColors; i++) {
    const parkingVehicle = vehicles[i]; // parking vehicles are first
    const size = parkingVehicle.cells.length;
    const capacity = VEHICLE_CAPACITY[size] ?? 4;
    for (let j = 0; j < capacity; j++) {
      passengers.push({ id: `p${pidx++}`, color: parkColors[i], boarded: false });
    }
  }

  return { vehicles, passengers, parkingSpots };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a guaranteed-solvable procedural level.
 * @param {number} levelIndex - 0-based (0 = game level 4)
 */
export function generateLevel(levelIndex) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const data = generateLevelAttempt(levelIndex);
    if (!data) continue;

    const { vehicles, passengers, parkingSpots } = data;
    if (isSolvable(vehicles, passengers, parkingSpots)) {
      return {
        label:        `Level ${levelIndex + 4}`,
        vehicles,
        passengers,
        parkingSpots,
      };
    }
  }

  // Fallback: trivially solvable 2-color level
  return generateTrivialLevel(levelIndex);
}

/** Fallback: one parking vehicle per color, no blockers */
function generateTrivialLevel(levelIndex) {
  const parkingSpots = Array(COLS).fill(null);
  parkingSpots[2] = { color: 'red' };
  parkingSpots[5] = { color: 'blue' };

  const vehicles = [
    { id: 'v1', color: 'red',  direction: 'up', cells: [[2, 6], [2, 7]], exited: false, parked: false },
    { id: 'v2', color: 'blue', direction: 'up', cells: [[5, 6], [5, 7]], exited: false, parked: false },
    { id: 'v3', color: 'teal', direction: 'right', cells: [[0, 4], [1, 4]], exited: false, parked: false },
  ];

  const passengers = [
    { id: 'p1', color: 'red',  boarded: false },
    { id: 'p2', color: 'red',  boarded: false },
    { id: 'p3', color: 'red',  boarded: false },
    { id: 'p4', color: 'red',  boarded: false },
    { id: 'p5', color: 'blue', boarded: false },
    { id: 'p6', color: 'blue', boarded: false },
    { id: 'p7', color: 'blue', boarded: false },
    { id: 'p8', color: 'blue', boarded: false },
  ];

  return { label: `Level ${levelIndex + 4}`, vehicles, passengers, parkingSpots };
}
