// ─── Hand-Crafted Levels ─────────────────────────────────────────────────────
// Grid: 7 cols (0-6) × 9 rows (0-8)
// Vehicle cells: [[col, row], ...] sorted along movement axis
// direction: up | down | left | right (ALSO determines exit side)
// size 2 = car, size 3 = bus

/**
 * Level 1 – Easy (8 vehicles)
 * Solution order: v4(up), v2→v1(right), v3(down), v5→v8, v6(left), v7(down)
 */
export const LEVEL_1 = {
  label: 'Level 1',
  vehicles: [
    { id: 'v1', color: 'red',    direction: 'right', cells: [[0,0],[1,0]] },
    { id: 'v2', color: 'blue',   direction: 'right', cells: [[4,0],[5,0]] },
    { id: 'v3', color: 'green',  direction: 'down',  cells: [[0,2],[0,3]] },
    { id: 'v4', color: 'purple', direction: 'up',    cells: [[2,1],[2,2]] },
    { id: 'v5', color: 'yellow', direction: 'right', cells: [[3,3],[4,3],[5,3]] },
    { id: 'v6', color: 'teal',   direction: 'left',  cells: [[1,5],[2,5],[3,5]] },
    { id: 'v7', color: 'orange', direction: 'down',  cells: [[5,6],[5,7]] },
    { id: 'v8', color: 'pink',   direction: 'up',    cells: [[3,7],[3,8]] },
  ],
};

/**
 * Level 2 – Medium (10 vehicles)
 * Dependency chain: v8→v5→v6→v7→v2→v3, v9→v4, v3→v10
 */
export const LEVEL_2 = {
  label: 'Level 2',
  vehicles: [
    { id: 'v1',  color: 'red',    direction: 'right', cells: [[0,0],[1,0],[2,0]] },
    { id: 'v2',  color: 'blue',   direction: 'down',  cells: [[4,0],[4,1],[4,2]] },
    { id: 'v3',  color: 'green',  direction: 'left',  cells: [[5,1],[6,1]] },
    { id: 'v4',  color: 'yellow', direction: 'down',  cells: [[0,2],[0,3]] },
    { id: 'v5',  color: 'purple', direction: 'right', cells: [[1,3],[2,3],[3,3]] },
    { id: 'v6',  color: 'teal',   direction: 'up',    cells: [[2,5],[2,6]] },
    { id: 'v7',  color: 'orange', direction: 'left',  cells: [[3,5],[4,5]] },
    { id: 'v8',  color: 'pink',   direction: 'down',  cells: [[6,3],[6,4],[6,5]] },
    { id: 'v9',  color: 'indigo', direction: 'right', cells: [[0,6],[1,6]] },
    { id: 'v10', color: 'lime',   direction: 'up',    cells: [[5,7],[5,8]] },
  ],
};

/**
 * Level 3 – Hard (12 vehicles)
 * Dependency chain: v11→v10→v4→v2→v8→v7→v3→v5→v1 (plus v6, v9, v12 immediate)
 */
export const LEVEL_3 = {
  label: 'Level 3',
  vehicles: [
    { id: 'v1',  color: 'red',    direction: 'right', cells: [[0,0],[1,0]] },
    { id: 'v2',  color: 'blue',   direction: 'right', cells: [[3,0],[4,0]] },
    { id: 'v3',  color: 'green',  direction: 'down',  cells: [[2,0],[2,1],[2,2]] },
    { id: 'v4',  color: 'teal',   direction: 'down',  cells: [[5,0],[5,1]] },
    { id: 'v5',  color: 'purple', direction: 'right', cells: [[0,2],[1,2]] },
    { id: 'v6',  color: 'orange', direction: 'down',  cells: [[0,3],[0,4],[0,5]] },
    { id: 'v7',  color: 'yellow', direction: 'right', cells: [[1,3],[2,3]] },
    { id: 'v8',  color: 'pink',   direction: 'up',    cells: [[3,3],[3,4],[3,5]] },
    { id: 'v9',  color: 'lime',   direction: 'left',  cells: [[1,5],[2,5]] },
    { id: 'v10', color: 'indigo', direction: 'right', cells: [[3,6],[4,6],[5,6]] },
    { id: 'v11', color: 'red',    direction: 'up',    cells: [[6,5],[6,6],[6,7]] },
    { id: 'v12', color: 'blue',   direction: 'left',  cells: [[4,8],[5,8]] },
  ],
};

export const HAND_CRAFTED_LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];

/** Returns a fresh deep-clone of a level (so state mutations don't corrupt originals) */
export function getLevelData(levelDef) {
  return {
    ...levelDef,
    vehicles: levelDef.vehicles.map((v) => ({
      ...v,
      cells: v.cells.map((c) => [...c]),
      exited: false,
    })),
  };
}
