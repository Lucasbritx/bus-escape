// ─── Game Engine ────────────────────────────────────────────────────────────
// Grid: COLS × ROWS (col = x, row = y)
export const COLS = 7;
export const ROWS = 9;

// Capacity by vehicle size
export const VEHICLE_CAPACITY = { 2: 4, 3: 8 };

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Deep-clone a vehicle list (no functions, plain data) */
export function cloneVehicles(vehicles) {
  return vehicles.map((v) => ({ ...v, cells: v.cells.map((c) => [...c]) }));
}

/** Deep-clone passengers */
export function clonePassengers(passengers) {
  return passengers.map((p) => ({ ...p }));
}

/** Deep-clone parking spots */
export function cloneParkingSpots(spots) {
  return spots.map((s) => (s ? { ...s } : null));
}

/**
 * Build a ROWS×COLS grid of vehicleId | null from a vehicle list.
 * Only includes non-exited, non-parked vehicles.
 */
export function buildGrid(vehicles) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (const v of vehicles) {
    if (v.exited || v.parked) continue;
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
    if (v.exited || v.parked) continue;
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
 *
 * For UP vehicles: also check if a matching parking spot exists at top.
 * Returns { steps, exits, parks, parkCol }
 *   - exits: true if the vehicle will leave the grid (blockers)
 *   - parks: true if the vehicle will park in a spot above the grid
 *   - parkCol: column of the parking spot (only when parks=true)
 */
export function computeSlideSteps(vehicle, grid, parkingSpots = null) {
  const [dc, dr] = DIR_DELTA[vehicle.direction];

  // Leading cells (front in movement direction)
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
    // up
    const minRow = Math.min(...vehicle.cells.map(([, r]) => r));
    leadingCells = vehicle.cells.filter(([, r]) => r === minRow);
  }

  let steps = 0;
  while (true) {
    steps++;
    let blocked = false;
    let willExit = false;

    for (const [lc, lr] of leadingCells) {
      const nc = lc + dc * steps;
      const nr = lr + dr * steps;

      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) {
        willExit = true;
        break;
      }

      if (grid[nr][nc] !== null && grid[nr][nc] !== vehicle.id) {
        blocked = true;
        break;
      }
    }

    if (blocked) return { steps: steps - 1, exits: false, parks: false };

    if (willExit) {
      // For UP vehicles: check if a matching parking spot is available
      if (vehicle.direction === 'up' && parkingSpots) {
        // All cells of this vehicle must share the same column (vertical vehicle)
        const vCol = vehicle.cells[0][0];
        const allSameCol = vehicle.cells.every(([c]) => c === vCol);
        if (allSameCol) {
          const spot = parkingSpots[vCol];
          if (spot && spot.color === vehicle.color && !spot.occupiedBy) {
            return { steps: steps - 1, exits: false, parks: true, parkCol: vCol };
          }
        }
      }
      return { steps: steps - 1, exits: true, parks: false };
    }
  }
}

/**
 * Apply a slide to a vehicle (mutates a cloned copy).
 * Returns new vehicle state.
 */
export function applySlide(vehicle, steps, exits, parks = false) {
  const [dc, dr] = DIR_DELTA[vehicle.direction];
  const newCells = vehicle.cells.map(([c, r]) => [c + dc * steps, r + dr * steps]);
  return {
    ...vehicle,
    cells: newCells,
    exited: exits ? true : vehicle.exited,
    parked: parks ? true : vehicle.parked,
    exitSteps: exits ? steps : undefined,
  };
}

/**
 * Board passengers onto a freshly parked vehicle.
 * Returns updated passengers array.
 * Each vehicle holds VEHICLE_CAPACITY[size] passengers of matching color.
 */
export function boardPassengers(vehicle, passengers) {
  const size = vehicle.cells.length;
  const capacity = VEHICLE_CAPACITY[size] ?? 4;
  const color = vehicle.color;

  let boarded = 0;
  return passengers.map((p) => {
    if (p.boarded) return p;
    if (p.color !== color) return p;
    if (boarded >= capacity) return p;
    boarded++;
    return { ...p, boarded: true };
  });
}

/**
 * Given the current vehicle list, slide the vehicle with the given id.
 * Returns { vehicles, passengers, parkingSpots, moved, exited, parks, steps }
 */
export function slideVehicle(vehicleId, vehicles, parkingSpots, passengers) {
  const grid = buildGrid(vehicles);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle || vehicle.exited || vehicle.parked) {
    return { vehicles, passengers, parkingSpots, moved: false, exited: false, parks: false, steps: 0 };
  }

  const { steps, exits, parks, parkCol } = computeSlideSteps(vehicle, grid, parkingSpots);
  if (steps === 0 && !exits && !parks) {
    return { vehicles, passengers, parkingSpots, moved: false, exited: false, parks: false, steps: 0 };
  }

  const actuallyMoves = steps > 0 || exits || parks;
  if (!actuallyMoves) {
    return { vehicles, passengers, parkingSpots, moved: false, exited: false, parks: false, steps: 0 };
  }

  const updatedVehicle = applySlide(vehicle, steps, exits, parks);
  let newVehicles = vehicles.map((v) => (v.id === vehicleId ? updatedVehicle : v));

  let newPassengers = passengers;
  let newParkingSpots = parkingSpots;

  if (parks && parkCol !== undefined) {
    // Mark parking spot as occupied
    newParkingSpots = parkingSpots.map((s, i) =>
      i === parkCol ? { ...s, occupiedBy: vehicleId } : s
    );
    // Board matching passengers
    newPassengers = boardPassengers(updatedVehicle, passengers);
  }

  return {
    vehicles: newVehicles,
    passengers: newPassengers,
    parkingSpots: newParkingSpots,
    moved: true,
    exited: updatedVehicle.exited,
    parks: updatedVehicle.parked,
    steps,
  };
}

/** True when every passenger has boarded */
export function checkWin(passengers) {
  return passengers.length > 0 && passengers.every((p) => p.boarded);
}

/**
 * True when every non-exited, non-parked vehicle has zero valid moves.
 * This means the player is stuck and can't make any progress.
 */
export function checkGameOver(vehicles, parkingSpots) {
  const grid = buildGrid(vehicles);
  const active = vehicles.filter((v) => !v.exited && !v.parked);
  if (active.length === 0) return false; // all gone = win condition, not game over
  return active.every((v) => {
    const { steps, exits, parks } = computeSlideSteps(v, grid, parkingSpots);
    return steps === 0 && !exits && !parks;
  });
}

/** Stable string key for a board state (for BFS visited set) */
export function boardKey(vehicles, passengers) {
  const vKey = vehicles
    .filter((v) => !v.exited && !v.parked)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((v) => `${v.id}:${v.cells.map((c) => c.join(',')).join('|')}`)
    .join(';');
  const pKey = passengers.filter((p) => p.boarded).map((p) => p.id).sort().join(',');
  return `${vKey}||${pKey}`;
}
