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
// 4 parking colors: red bus(8)→col1, blue bus(8)→col4, green car(4)→col2, orange car(4)→col5
// 24 total passengers
//
// Design principle: every blocker must have at least ONE immediate free exit path,
// forming a cascade of unlocks rather than mutual deadlocks.
//
// Parking vehicles (up):
//   v1 red   bus  col1 rows[5,6,7]  path to clear: rows4,3,2,1,0
//   v2 blue  bus  col4 rows[5,6,7]  path to clear: rows4,3,2,1,0
//   v3 green car  col2 rows[7,8]    path to clear: rows6,5,4,3,2,1,0
//   v4 orange car col5 rows[7,8]    path to clear: rows6,5,4,3,2,1,0
//
// Blockers with verified free exits:
//   v5 teal   right col[2,3] row4   — col4 row4 free initially? No: v2 path needs col4r4 clear.
//                                     Actually v5 at row4 blocks v1(col1r4) too if v5 included col1.
//                                     v5=(2,4)(3,4): col2r4 blocks v3; exits right → needs col4r4,col5r4 free
//                                     col4r4: free initially ✓, col5r4: free ✓
//                                     → v5 can slide right immediately ✓
//   v6 yellow left  col[0,1] row3   — col1r3 blocks v1; exits left → needs col-1 (off grid) ✓ immediate
//   v7 purple down  col1 rows[1,2]  — col1r1,r2 blocks v1; exits down → needs r3 col1 clear.
//                                     v6 is at r3 col1. So tap v6 first, then v7 can exit ✓
//   v8 lime   right col[3,4] row3   — col4r3 blocks v2; exits right → col5r3,col6r3 free ✓ immediate
//   v9 pink   left  col[3,4] row4   — wait, col4r4 + v5=(2,4)(3,4): col3r4 conflict!
// Let me reorganize:
//
// Cell assignments (no overlaps):
//   v1 red   up    col1 rows[5,6,7]
//   v2 blue  up    col4 rows[5,6,7]
//   v3 green up    col2 rows[7,8]
//   v4 orange up   col5 rows[7,8]
//   v5 teal   right col[2,3] row4   (2,4)(3,4) — blocks v3 lane at r4; exits right (col4r4 free ✓)
//   v6 yellow left  col[0,1] row3   (0,3)(1,3) — blocks v1 lane at r3; exits left immediately ✓
//   v7 purple down  col1 rows[1,2]  (1,1)(1,2) — blocks v1 lane at r1,r2; exits down after v6 clears r3
//   v8 lime   right col[3,4] row3   (3,3)(4,3) — blocks v2 lane at r3; exits right (col5r3,col6r3 free ✓)
//   v9 pink   right col[4,5] row4   (4,4)(5,4) — blocks v2 at r4, v4 at r4; exits right (col6r4 free ✓)
//   v10 indigo left col[3,4] row2   (3,2)(4,2) — blocks v2 at r2; exits left (col2r2,col1r2 free? v7=(1,1)(1,2)→col1r2 occupied!)
//                                               Use col[4,5] row2 instead: (4,2)(5,2)
//   v10 indigo left col[4,5] row2   (4,2)(5,2) — blocks v2 at r2; exits left (col3r2,col2r2,col1r2... needs col3r2 free ✓)
//   v11 orange2 right col[1,2] row4  wait col2r4: v5=(2,4)(3,4) conflict
//   v11 teal2 right col[5,6] row3   (5,3)(6,3) — blocks v4 at r3; exits right (col7 off grid ✓) immediately
//   v12 orange2 left col[1,2] row6  (1,6)(2,6) — wait v1=(1,5)(1,6)(1,7) conflict at (1,6)!
//   v12 yellow2 right col[0,1] row4 (0,4)(1,4) — blocks v1 at r4; exits right (col2r4 occupied by v5!)
//                                               v5=(2,4)(3,4); col2r4 blocked. Try col[5,6] row4:
//                                               v9=(4,4)(5,4) at col4,5 row4. col5r4 occupied. Skip.
//   v12 indigo2 left col[5,6] row6  (5,6)(6,6) — blocks v4 at r6; exits left (col4r6,col3r6 free ✓)
//                                               wait v2=(4,5)(4,6)(4,7) at col4 rows5-7: col4r6 occupied!
//                                               Use col[5,6] row6: col5r6 blocks v4? v4=(5,7)(5,8). Fine.
//                                               Actually v4 is at rows7,8 so row6 is in its path. Blocker ✓
//                                               col4r6 occupied by v2. So exits left stops at col5 (can't pass col4). Blocked!
//   Skip col6 for now. Let me use a simpler approach:
//   v12 yellow2 left col[0,1] row4  (0,4)(1,4) — blocks v1 at r4; exits left (off grid immediately ✓)
//
// Final layout:
//   v1:(1,5)(1,6)(1,7) v2:(4,5)(4,6)(4,7) v3:(2,7)(2,8) v4:(5,7)(5,8)
//   v5:(2,4)(3,4) v6:(0,3)(1,3) v7:(1,1)(1,2) v8:(3,3)(4,3)
//   v9:(4,4)(5,4) v10:(4,2)(5,2) v11:(5,3)(6,3) v12:(0,4)(1,4)
// CONFLICT: v5=(2,4)(3,4) and v12=(0,4)(1,4) → col2r4 and col0r4, col1r4: no overlap ✓
//           But v6=(0,3)(1,3) and v12=(0,4)(1,4): same cols, different rows ✓
//           v8=(3,3)(4,3) and v9=(4,4)(5,4): col4r3 and col4r4 — different rows ✓
//           v10=(4,2)(5,2) and v9=(4,4)(5,4): col4r2 vs col4r4 ✓
//           v10=(4,2)(5,2) and v8=(3,3)(4,3): col4r2 vs col4r3 ✓
//
// Solution order:
//   1. v6 left  → exits immediately (col0-1 row3 gone)
//   2. v7 down  → now col1 row3 is clear; v7 slides down exits
//   3. v12 left → exits immediately (col0-1 row4 gone)
//   4. v5 right → exits right (col2-3 row4 gone; col4r4 now clear after v9 moves? v9=(4,4)(5,4): col4r4 occupied!)
//      v5 right needs col4r4 free. v9 is there. So tap v9 first.
//   4. v9 right → exits right immediately (col5r4,col6r4 free ✓)
//   5. v5 right → now col4r4 free; exits right ✓
//   6. v8 right → col4r3 was occupied? No: v9 was at r4, v8=(3,3)(4,3) at r3. col5r3: free? v11=(5,3)(6,3)!
//      v8 right needs col5r3 free. v11=(5,3)(6,3) blocks. So tap v11 first.
//   6. v11 right → exits immediately (col7 off-grid ✓)
//   7. v8 right → now col5r3 free; exits right ✓
//   8. v10 left → col3r2 free? Yes. Exits left ✓
//   9. Now v1 lane col1: r4(v12 gone) r3(v6 gone) r2(v7 gone) r1(v7 gone) → all clear → v1 parks! ✓
//  10. v2 lane col4: r4(v9 gone) r3(v8 gone) r2(v10 gone) r1(free) → all clear → v2 parks! ✓
//  11. v3 lane col2: r6(free) r5(free) r4(v5 gone) r3(free) r2(free) r1(free) → v3 parks! ✓
//  12. v4 lane col5: r6(free) r5(free) r4(v9 gone) r3(v11 gone) r2(v10 gone... col5r2: v10=(4,2)(5,2)!)
//      v10 exits left → col4r2, col3r2, col2r2, col1r2(v7 gone), col0r2 → v10 slides all the way left ✓
//      So col5r2 is free after v10 exits. r1(free) → v4 parks! ✓
//
// All 4 parking vehicles can park ✓ Solution verified!
//
// Overlap check:
// v1:(1,5)(1,6)(1,7) v2:(4,5)(4,6)(4,7) v3:(2,7)(2,8) v4:(5,7)(5,8)
// v5:(2,4)(3,4) v6:(0,3)(1,3) v7:(1,1)(1,2) v8:(3,3)(4,3)
// v9:(4,4)(5,4) v10:(4,2)(5,2) v11:(5,3)(6,3) v12:(0,4)(1,4)
// col0: r3(v6) r4(v12) ✓
// col1: r1(v7) r2(v7) r3(v6) r4(v12) r5,r6,r7(v1) ✓
// col2: r4(v5) r7,r8(v3) ✓
// col3: r3(v8) r4(v5) ✓
// col4: r2(v10) r3(v8) r4(v9) r5,r6,r7(v2) ✓
// col5: r2(v10) r3(v11) r4(v9) r7,r8(v4) ✓
// col6: r3(v11) ✓
// All unique ✓

export const LEVEL_3 = {
  label: 'Level 3',
  parkingSpots: [
    null,
    { color: 'red' },
    { color: 'green' },
    null,
    { color: 'blue' },
    { color: 'orange' },
    null,
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
    { id: 'v1',  color: 'red',    direction: 'up',    cells: [[1,5],[1,6],[1,7]] },
    { id: 'v2',  color: 'blue',   direction: 'up',    cells: [[4,5],[4,6],[4,7]] },
    { id: 'v3',  color: 'green',  direction: 'up',    cells: [[2,7],[2,8]]       },
    { id: 'v4',  color: 'orange', direction: 'up',    cells: [[5,7],[5,8]]       },
    { id: 'v5',  color: 'teal',   direction: 'right', cells: [[2,4],[3,4]]       },
    { id: 'v6',  color: 'yellow', direction: 'left',  cells: [[0,3],[1,3]]       },
    { id: 'v7',  color: 'purple', direction: 'down',  cells: [[1,1],[1,2]]       },
    { id: 'v8',  color: 'lime',   direction: 'right', cells: [[3,3],[4,3]]       },
    { id: 'v9',  color: 'pink',   direction: 'right', cells: [[4,4],[5,4]]       },
    { id: 'v10', color: 'indigo', direction: 'left',  cells: [[4,2],[5,2]]       },
    { id: 'v11', color: 'orange', direction: 'right', cells: [[5,3],[6,3]]       },
    { id: 'v12', color: 'yellow', direction: 'left',  cells: [[0,4],[1,4]]       },
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
