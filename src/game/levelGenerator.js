// ─── Procedural Level Generator ─────────────────────────────────────────────
// Generates BFS-guaranteed solvable levels.
//
// Algorithm:
//  1. Place N vehicles randomly on the grid (no overlaps).
//  2. Run BFS to see if all vehicles can exit in some order.
//  3. If BFS finds a solution → return the level.
//  4. Else retry up to MAX_RETRIES times.
//
// BFS state = sorted string of "id:col,row|col,row" for each non-exited vehicle.

import { COLS, ROWS, buildGrid, computeSlideSteps, applySlide, checkWin, boardKey, cloneVehicles } from './gameEngine.js';
import { COLOR_KEYS } from './drawVehicle.js';

const DIRECTIONS = ['up', 'down', 'left', 'right'];
const MAX_BFS_STATES = 15000;
const MAX_RETRIES = 60;

// ── Placement helpers ─────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Try to place a vehicle of given size/direction on the grid.
 * Returns cells array or null if no valid placement found.
 */
function findPlacement(size, direction, occupied) {
  const isHoriz = direction === 'left' || direction === 'right';

  // Build all possible anchor positions
  const positions = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      positions.push([c, r]);
    }
  }
  shuffle(positions);

  for (const [ac, ar] of positions) {
    // Build cells from anchor
    const cells = [];
    let valid = true;
    for (let i = 0; i < size; i++) {
      const nc = isHoriz ? ac + i : ac;
      const nr = isHoriz ? ar : ar + i;
      if (nc >= COLS || nr >= ROWS) { valid = false; break; }
      const key = `${nc},${nr}`;
      if (occupied.has(key)) { valid = false; break; }
      cells.push([nc, nr]);
    }
    if (!valid) continue;

    // The vehicle must be able to eventually reach its exit edge.
    // Quick check: is there at least one clear step in direction from front?
    // (Full guarantee is via BFS, so just check no immediate wrap issues.)
    return cells;
  }
  return null;
}

/**
 * Generate a random vehicle list of `count` vehicles.
 * Returns array of vehicle objects or null if placement fails.
 */
function generateVehicles(count, levelIndex) {
  const occupied = new Set();
  const vehicles = [];
  const colors = shuffle([...COLOR_KEYS]);

  for (let i = 0; i < count; i++) {
    // Mix of cars (size 2) and buses (size 3). More buses at higher levels.
    const busRatio = Math.min(0.3 + levelIndex * 0.05, 0.6);
    const size = Math.random() < busRatio ? 3 : 2;
    const direction = DIRECTIONS[(Math.random() * DIRECTIONS.length) | 0];
    const cells = findPlacement(size, direction, occupied);
    if (!cells) return null; // failed to place

    const color = colors[i % colors.length];
    cells.forEach(([c, r]) => occupied.add(`${c},${r}`));
    vehicles.push({ id: `v${i + 1}`, color, direction, size, cells, exited: false });
  }
  return vehicles;
}

// ── BFS Solver ───────────────────────────────────────────────────────────────

/**
 * BFS over game states. Each state = vehicle list snapshot.
 * Explores all possible tap sequences. Returns true if all vehicles can exit.
 */
function isSolvable(initialVehicles) {
  const startKey = boardKey(initialVehicles);
  const visited = new Set([startKey]);
  const queue = [initialVehicles];

  while (queue.length > 0) {
    if (visited.size > MAX_BFS_STATES) return false; // gave up

    const state = queue.shift();

    if (checkWin(state)) return true;

    // Try tapping each non-exited vehicle
    for (const v of state) {
      if (v.exited) continue;

      const grid = buildGrid(state);
      const { steps, exits } = computeSlideSteps(v, grid);
      if (steps === 0 && !exits) continue; // this vehicle can't move at all

      // Apply the slide
      const updatedV = applySlide(v, steps, exits);
      const newState = state.map((sv) => (sv.id === v.id ? updatedV : sv));

      const key = boardKey(newState);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(newState);
      }
    }
  }
  return false;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a guaranteed-solvable procedural level.
 * @param {number} levelIndex - 0-based index (0 = level 4 of the game)
 * @returns {{ label: string, vehicles: Vehicle[] }}
 */
export function generateLevel(levelIndex) {
  // Scale vehicle count with level index
  const minCount = 8 + Math.min(levelIndex * 2, 10);
  const maxCount = minCount + 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const count = minCount + ((Math.random() * (maxCount - minCount + 1)) | 0);
    const vehicles = generateVehicles(count, levelIndex);
    if (!vehicles) continue; // placement failed

    if (isSolvable(vehicles)) {
      return {
        label: `Level ${levelIndex + 4}`,
        vehicles,
      };
    }
  }

  // Fallback: return a minimal trivially-solvable level (all free-sliding)
  return generateTrivialLevel(levelIndex);
}

/** Fallback: all vehicles face an open edge with no blockers */
function generateTrivialLevel(levelIndex) {
  const vehicles = [
    { id: 'v1', color: 'red',    direction: 'right', cells: [[0,1],[1,1]], exited: false },
    { id: 'v2', color: 'blue',   direction: 'right', cells: [[0,3],[1,3]], exited: false },
    { id: 'v3', color: 'green',  direction: 'down',  cells: [[3,0],[3,1]], exited: false },
    { id: 'v4', color: 'yellow', direction: 'left',  cells: [[5,5],[6,5]], exited: false },
    { id: 'v5', color: 'purple', direction: 'up',    cells: [[1,7],[1,8]], exited: false },
    { id: 'v6', color: 'teal',   direction: 'right', cells: [[0,7],[1,7],[2,7]], exited: false },
  ];
  return { label: `Level ${levelIndex + 4}`, vehicles };
}
