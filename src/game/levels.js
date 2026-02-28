// ─── Hand-Crafted Levels ─────────────────────────────────────────────────────
// Grid: 7 cols (0-6) × 9 rows (0-8)
// Vehicle cells: [[col, row], ...] sorted along movement axis
//
// direction: up    → parking vehicle (slides into colored spot above grid)
// direction: down/left/right → blocker (exits grid to clear the path)
//
// parkingSpots: 7-element array (one per col). Each slot is { color } or null.
// passengers: array of { id, color }. Win = all boarded.
// Cars (size 2) board 4 passengers. Buses (size 3) board 8 passengers.

// ── Level 1 – Easy ────────────────────────────────────────────────────────────
// Red car parks at col 2; blue car parks at col 5.
// v1 red  up col2 rows[6,7] — path: rows5,4,3,2,1,0 must be clear
// v2 blue up col5 rows[6,7] — path: rows5,4,3,2,1,0 must be clear
// Blockers:
//   v3 green down  col2 rows[1,2] — tap → exits down, clears v1 lane
//   v4 teal  right col[0,1] row5  — tap → exits right (doesn't block either lane)
//   v5 orange right col[3,4] row4 — tap → exits right (doesn't touch col2 or col5)
//   v6 purple right col[0,1] row3 — tap → exits right
//   v7 yellow down  col5 rows[2,3] — tap → exits down, clears v2 lane
//
// No cell overlaps verified:
// v1:(2,6)(2,7) v2:(5,6)(5,7) v3:(2,1)(2,2)
// v4:(0,5)(1,5) v5:(3,4)(4,4) v6:(0,3)(1,3) v7:(5,2)(5,3) ✓

export const LEVEL_1 = {
  label: 'Level 1',
  parkingSpots: [
    null,
    null,
    { color: 'red' },
    null,
    null,
    { color: 'blue' },
    null,
  ],
  passengers: [
    { id: 'p1', color: 'red'  },
    { id: 'p2', color: 'red'  },
    { id: 'p3', color: 'red'  },
    { id: 'p4', color: 'red'  },
    { id: 'p5', color: 'blue' },
    { id: 'p6', color: 'blue' },
    { id: 'p7', color: 'blue' },
    { id: 'p8', color: 'blue' },
  ],
  vehicles: [
    { id: 'v1', color: 'red',    direction: 'up',    cells: [[2,6],[2,7]] },
    { id: 'v2', color: 'blue',   direction: 'up',    cells: [[5,6],[5,7]] },
    { id: 'v3', color: 'green',  direction: 'down',  cells: [[2,1],[2,2]] },
    { id: 'v4', color: 'teal',   direction: 'right', cells: [[0,5],[1,5]] },
    { id: 'v5', color: 'orange', direction: 'right', cells: [[3,4],[4,4]] },
    { id: 'v6', color: 'purple', direction: 'right', cells: [[0,3],[1,3]] },
    { id: 'v7', color: 'yellow', direction: 'down',  cells: [[5,2],[5,3]] },
  ],
};

// ── Level 2 – Medium ──────────────────────────────────────────────────────────
// 3 parking colors: red bus(8) → col1, blue car(4) → col4, green car(4) → col6
// 16 total passengers
//
// v1 red  bus up col1 rows[5,6,7] — path: rows4,3,2,1,0
// v2 blue car up col4 rows[6,7]   — path: rows5,4,3,2,1,0
// v3 green car up col6 rows[5,6]  — path: rows4,3,2,1,0
// Blockers for v1's lane (col1):
//   v4 yellow right col[0,1] row4     — col1 row4 blocks v1
//   v5 teal   down  col1 rows[1,2]    — col1 rows1-2 blocks v1
//   v7 purple right col[0,1] row3     — col1 row3 blocks v1
// Blockers for v2's lane (col4):
//   v6 orange left  col[3,4] row5     — col4 row5 blocks v2
//   v8 lime   right col[4,5,6] row3   — wait: col6 row3 blocks v3! Use col[4,5] row3.
// Blockers for v3's lane (col6):
//   v9  pink  down  col6 rows[1,2]    — col6 rows1-2 blocks v3
//   v10 indigo left col[5,6] row4     — col6 row4 blocks v3
//
// No overlaps:
// v1:(1,5)(1,6)(1,7) v2:(4,6)(4,7) v3:(6,5)(6,6)
// v4:(0,4)(1,4)      v5:(1,1)(1,2) v6:(3,5)(4,5)
// v7:(0,3)(1,3)      v8:(4,3)(5,3) v9:(6,1)(6,2) v10:(5,4)(6,4)
// Check col1: 1(v5) 2(v5) 3(v7) 4(v4) 5,6,7(v1) ✓
// Check col4: 3(v8) 5(v6) 6,7(v2) ✓
// Check col6: 1,2(v9) 4(v10) 5,6(v3) ✓ (row3 col6: empty ✓)
// All unique ✓

export const LEVEL_2 = {
  label: 'Level 2',
  parkingSpots: [
    null,
    { color: 'red' },
    null,
    null,
    { color: 'blue' },
    null,
    { color: 'green' },
  ],
  passengers: [
    { id: 'p1',  color: 'red'   },
    { id: 'p2',  color: 'red'   },
    { id: 'p3',  color: 'red'   },
    { id: 'p4',  color: 'red'   },
    { id: 'p5',  color: 'red'   },
    { id: 'p6',  color: 'red'   },
    { id: 'p7',  color: 'red'   },
    { id: 'p8',  color: 'red'   },
    { id: 'p9',  color: 'blue'  },
    { id: 'p10', color: 'blue'  },
    { id: 'p11', color: 'blue'  },
    { id: 'p12', color: 'blue'  },
    { id: 'p13', color: 'green' },
    { id: 'p14', color: 'green' },
    { id: 'p15', color: 'green' },
    { id: 'p16', color: 'green' },
  ],
  vehicles: [
    { id: 'v1',  color: 'red',    direction: 'up',    cells: [[1,5],[1,6],[1,7]] },
    { id: 'v2',  color: 'blue',   direction: 'up',    cells: [[4,6],[4,7]]       },
    { id: 'v3',  color: 'green',  direction: 'up',    cells: [[6,5],[6,6]]       },
    { id: 'v4',  color: 'yellow', direction: 'right', cells: [[0,4],[1,4]]       },
    { id: 'v5',  color: 'teal',   direction: 'down',  cells: [[1,1],[1,2]]       },
    { id: 'v6',  color: 'orange', direction: 'left',  cells: [[3,5],[4,5]]       },
    { id: 'v7',  color: 'purple', direction: 'right', cells: [[0,3],[1,3]]       },
    { id: 'v8',  color: 'lime',   direction: 'right', cells: [[4,3],[5,3]]       },
    { id: 'v9',  color: 'pink',   direction: 'down',  cells: [[6,1],[6,2]]       },
    { id: 'v10', color: 'indigo', direction: 'left',  cells: [[5,4],[6,4]]       },
  ],
};

// ── Level 3 – Hard ────────────────────────────────────────────────────────────
// 4 parking colors: red bus(8)→col0, blue bus(8)→col3, green car(4)→col5, orange car(4)→col6
// 24 total passengers
//
// Parking vehicles:
//   v1 red   bus up col0 rows[5,6,7] — path: rows4,3,2,1,0
//   v2 blue  bus up col3 rows[5,6,7] — path: rows4,3,2,1,0
//   v3 green car up col5 rows[6,7]   — path: rows5,4,3,2,1,0
//   v4 orange car up col6 rows[6,7]  — path: rows5,4,3,2,1,0
// Blockers for col0:
//   v6 yellow down  col0 rows[1,2]   — col0 rows1-2
//   v7 purple right col[0,1] row3    — col0 row3
//   v8 teal   right col[0,1] row4    — col0 row4
// Blockers for col3:
//   v9  lime  right col[3,4,5] row1  — col3 row1; col5 row1: fine (v3 rows6-7) ✓
//   v10 pink  left  col[2,3] row2    — col3 row2
//   v11 indigo right col[3,4] row3   — col3 row3
//   v12 red-dup right col[2,3] row4  — use 'crimson' or repeat color is ok
// Blockers for col5:
//   v13 lime2 right col[5,6] row4    — col5 row4; col6 row4: fine (v4 rows6-7) ✓
//   v14 blue2 down  col5 rows[2,3]   — col5 rows2-3
// Blockers for col6:
//   v15 green2 left col[5,6] row5    — col6 row5; col5 row5: fine ✓
//   v16 orange2 down col6 rows[2,3]  — wait, col6 rows2-3 and v15 uses col6 row5, v4 rows6-7 ✓
//   But v9=(3,1)(4,1)(5,1) — col5 row1 ✓, v14=(5,2)(5,3) col5 rows2-3 ✓
//   v13=(5,4)(6,4) col6 row4: ok since v4 rows6-7 ✓
//   v15=(5,5)(6,5) col6 row5 ✓
//   For col6 rows1,2,3: need blocker. v16 orange2 down col6 rows[1,2] but v9 col5 row1 is ok.
//   Wait v9=(3,1)(4,1)(5,1): col6 row1 is free. Add v16 yellow2 right col[6] → only 1 cell, min size=2. 
//   Use v16 down col6 rows[1,2] instead.
//
// Final overlap check:
// v1:(0,5)(0,6)(0,7) v2:(3,5)(3,6)(3,7) v3:(5,6)(5,7) v4:(6,6)(6,7)
// v6:(0,1)(0,2) v7:(0,3)(1,3) v8:(0,4)(1,4)
// v9:(3,1)(4,1)(5,1) v10:(2,2)(3,2) v11:(3,3)(4,3) v12:(2,4)(3,4)
// v13:(5,4)(6,4) v14:(5,2)(5,3) v15:(5,5)(6,5) v16:(6,1)(6,2)
// col0: 1,2(v6) 3(v7) 4(v8) 5,6,7(v1) ✓
// col1: 3(v7) 4(v8) ✓
// col2: 2(v10) 4(v12) ✓
// col3: 1(v9) 2(v10) 3(v11) 4(v12) 5,6,7(v2) ✓
// col4: 1(v9) 3(v11) ✓
// col5: 1(v9) 2,3(v14) 4(v13) 5(v15) 6,7(v3) ✓
// col6: 1,2(v16) 4(v13) 5(v15) 6,7(v4) ✓ (row3 col6: empty ✓)
// All unique ✓

export const LEVEL_3 = {
  label: 'Level 3',
  parkingSpots: [
    { color: 'red' },
    null,
    null,
    { color: 'blue' },
    null,
    { color: 'green' },
    { color: 'orange' },
  ],
  passengers: [
    { id: 'p1',  color: 'red'    },
    { id: 'p2',  color: 'red'    },
    { id: 'p3',  color: 'red'    },
    { id: 'p4',  color: 'red'    },
    { id: 'p5',  color: 'red'    },
    { id: 'p6',  color: 'red'    },
    { id: 'p7',  color: 'red'    },
    { id: 'p8',  color: 'red'    },
    { id: 'p9',  color: 'blue'   },
    { id: 'p10', color: 'blue'   },
    { id: 'p11', color: 'blue'   },
    { id: 'p12', color: 'blue'   },
    { id: 'p13', color: 'blue'   },
    { id: 'p14', color: 'blue'   },
    { id: 'p15', color: 'blue'   },
    { id: 'p16', color: 'blue'   },
    { id: 'p17', color: 'green'  },
    { id: 'p18', color: 'green'  },
    { id: 'p19', color: 'green'  },
    { id: 'p20', color: 'green'  },
    { id: 'p21', color: 'orange' },
    { id: 'p22', color: 'orange' },
    { id: 'p23', color: 'orange' },
    { id: 'p24', color: 'orange' },
  ],
  vehicles: [
    { id: 'v1',  color: 'red',    direction: 'up',    cells: [[0,5],[0,6],[0,7]] },
    { id: 'v2',  color: 'blue',   direction: 'up',    cells: [[3,5],[3,6],[3,7]] },
    { id: 'v3',  color: 'green',  direction: 'up',    cells: [[5,6],[5,7]]       },
    { id: 'v4',  color: 'orange', direction: 'up',    cells: [[6,6],[6,7]]       },
    { id: 'v6',  color: 'yellow', direction: 'down',  cells: [[0,1],[0,2]]       },
    { id: 'v7',  color: 'purple', direction: 'right', cells: [[0,3],[1,3]]       },
    { id: 'v8',  color: 'teal',   direction: 'right', cells: [[0,4],[1,4]]       },
    { id: 'v9',  color: 'lime',   direction: 'right', cells: [[3,1],[4,1],[5,1]] },
    { id: 'v10', color: 'pink',   direction: 'left',  cells: [[2,2],[3,2]]       },
    { id: 'v11', color: 'indigo', direction: 'right', cells: [[3,3],[4,3]]       },
    { id: 'v12', color: 'yellow', direction: 'right', cells: [[2,4],[3,4]]       },
    { id: 'v13', color: 'teal',   direction: 'right', cells: [[5,4],[6,4]]       },
    { id: 'v14', color: 'blue',   direction: 'down',  cells: [[5,2],[5,3]]       },
    { id: 'v15', color: 'green',  direction: 'left',  cells: [[5,5],[6,5]]       },
    { id: 'v16', color: 'orange', direction: 'down',  cells: [[6,1],[6,2]]       },
  ],
};

export const HAND_CRAFTED_LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];

/** Returns a fresh deep-clone of a level (so state mutations don't corrupt originals) */
export function getLevelData(levelDef) {
  return {
    ...levelDef,
    parkingSpots: levelDef.parkingSpots.map((s) => s ? { ...s } : null),
    passengers:   levelDef.passengers.map((p) => ({ ...p, boarded: false })),
    vehicles:     levelDef.vehicles.map((v) => ({
      ...v,
      cells:  v.cells.map((c) => [...c]),
      exited: false,
      parked: false,
    })),
  };
}
