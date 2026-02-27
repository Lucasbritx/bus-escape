// ─── Game Engine ────────────────────────────────────────────────────────────
// Grid: COLS × ROWS (col = x, row = y)
export const COLS = 7;
export const ROWS = 9;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Deep-clone a vehicle list (no functions, plain data) */
export function cloneVehicles(vehicles) {
  return vehicles.map((v) => ({ ...v, cells: v.cells.map((c) => [...c]) }));
}

/**
 * Build a ROWS×COLS grid of vehicleId | null from a vehicle list.
 * Only includes non-exited vehicles.
 */
export function buildGrid(vehicles) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (const v of vehicles) {
    if (v.exited) continue;
    for (const [col, row] of v.cells) {
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        grid[row][col] = v.id;
      }
    }
  }
  return grid;
}

/** Return the vehicle object at the given cell, or null */
export function getVehicleAt(col, row, vehicles) {
  for (const v of vehicles) {
    if (v.exited) continue;
    for (const [vc, vr] of v.cells) {
      if (vc === col && vr === row) return v;
    }
  }
  return null;
}

// ── Direction helpers ─────────────────────────────────────────────────────────

const DIR_DELTA = {
  up:    [0, -1],
  down:  [0,  1],
  left:  [-1, 0],
  right: [ 1, 0],
};

/** Is this direction horizontal? */
export function isHorizontal(dir) {
  return dir === 'left' || dir === 'right';
}

/**
 * Given a vehicle and a grid, compute how many steps it can slide
 * in its direction before hitting a wall or another vehicle.
 * Returns steps (0 = blocked, positive = can move, special Infinity-ish
 * value indicates it will exit the grid entirely).
 */
export function computeSlideSteps(vehicle, grid) {
  const [dc, dr] = DIR_DELTA[vehicle.direction];

  // The "leading" cells: the cells at the front in the movement direction
  // For a right-moving vehicle, the leading cell is the rightmost cell.
  let leadingCells;
  if (vehicle.direction === 'right') {
    const maxCol = Math.max(...vehicle.cells.map(([c]) => c));
    leadingCells = vehicle.cells.filter(([c]) => c === maxCol);
  } else if (vehicle.direction === 'left') {
    const minCol = Math.min(...vehicle.cells.map(([c]) => c));
    leadingCells = vehicle.cells.filter(([c]) => c === minCol);
  } else if (vehicle.direction === 'down') {
    const maxRow = Math.max(...vehicle.cells.map(([, r]) => r));
    leadingCells = vehicle.cells.filter(([, r]) => r === maxRow);
  } else {
    const minRow = Math.min(...vehicle.cells.map(([, r]) => r));
    leadingCells = vehicle.cells.filter(([, r]) => r === minRow);
  }

  let steps = 0;
  // Try stepping forward one at a time
  while (true) {
    steps++;
    let blocked = false;
    let willExit = false;

    for (const [lc, lr] of leadingCells) {
      const nc = lc + dc * steps;
      const nr = lr + dr * steps;

      // Out of grid → vehicle will exit
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) {
        willExit = true;
        break;
      }

      // Occupied by another vehicle?
      if (grid[nr][nc] !== null && grid[nr][nc] !== vehicle.id) {
        blocked = true;
        break;
      }
    }

    if (willExit) return { steps: steps - 1, exits: true };
    if (blocked) return { steps: steps - 1, exits: false };
  }
}

/**
 * Apply a slide to a vehicle (mutates a cloned copy).
 * Returns new vehicle state and whether it exited.
 */
export function applySlide(vehicle, steps, exits) {
  const [dc, dr] = DIR_DELTA[vehicle.direction];
  const newCells = vehicle.cells.map(([c, r]) => [c + dc * steps, r + dr * steps]);
  return {
    ...vehicle,
    cells: newCells,
    exited: exits ? true : vehicle.exited,
    // If it exited, mark animation offset so canvas can animate it flying off
    exitSteps: exits ? steps : undefined,
  };
}

/**
 * Given the current vehicle list, slide the vehicle with the given id.
 * Returns { vehicles: newList, moved: bool, exited: bool, steps: number }
 */
export function slideVehicle(vehicleId, vehicles) {
  const grid = buildGrid(vehicles);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle || vehicle.exited) return { vehicles, moved: false, exited: false, steps: 0 };

  const { steps, exits } = computeSlideSteps(vehicle, grid);
  if (steps === 0 && !exits) return { vehicles, moved: false, exited: false, steps: 0 };

  // If exits with 0 steps (vehicle already at edge facing out) — still count as exited
  const actuallyMoves = steps > 0 || exits;
  if (!actuallyMoves) return { vehicles, moved: false, exited: false, steps: 0 };

  const updatedVehicle = applySlide(vehicle, steps, exits);

  const newVehicles = vehicles.map((v) => (v.id === vehicleId ? updatedVehicle : v));
  return {
    vehicles: newVehicles,
    moved: true,
    exited: updatedVehicle.exited,
    steps,
  };
}

/** True when every vehicle has exited */
export function checkWin(vehicles) {
  return vehicles.length > 0 && vehicles.every((v) => v.exited);
}

/** Stable string key for a board state (for BFS visited set) */
export function boardKey(vehicles) {
  return vehicles
    .filter((v) => !v.exited)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((v) => `${v.id}:${v.cells.map((c) => c.join(',')).join('|')}`)
    .join(';');
}
