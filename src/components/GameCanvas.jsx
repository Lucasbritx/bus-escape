import { useRef, useEffect, useCallback } from 'react';
import { COLS, ROWS, getVehicleAt } from '../game/gameEngine.js';
import { drawVehicle, drawGrid, drawParkingArea, drawPassengerQueue } from '../game/drawVehicle.js';

const ANIM_DURATION = 280; // ms

// Layout constants (as fractions of cellSize)
export const PARKING_ROWS = 1.5;  // parking area height in cell-units
export const PASSENGER_ROWS = 1.8; // passenger area height in cell-units

/**
 * GameCanvas
 * Props:
 *   vehicles       – current vehicle list
 *   passengers     – current passenger list
 *   parkingSpots   – current parking spots array
 *   onVehicleTap   – (vehicleId) => void
 *   animations     – Map<vehicleId, AnimState>
 *   width          – canvas width in px
 */
export default function GameCanvas({ vehicles, passengers, parkingSpots, onVehicleTap, animations, width }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const cellSize      = Math.floor(width / COLS);
  const canvasWidth   = cellSize * COLS;
  const parkingAreaH  = Math.round(cellSize * PARKING_ROWS);
  const passengerAreaH = Math.round(cellSize * PASSENGER_ROWS);
  const canvasHeight  = parkingAreaH + passengerAreaH + cellSize * ROWS;

  // Grid origin within canvas
  const offsetX = 0;
  const offsetY = parkingAreaH + passengerAreaH;

  // ── Draw loop ──────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Canvas background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Parking area (top)
    drawParkingArea(ctx, parkingSpots, vehicles, cellSize, offsetX, 0, parkingAreaH);

    // 3. Passenger queue (middle)
    drawPassengerQueue(ctx, passengers, cellSize, offsetX, parkingAreaH, passengerAreaH, COLS);

    // 4. Grid
    drawGrid(ctx, COLS, ROWS, cellSize, offsetX, offsetY);

    // 5. Vehicles
    const now = performance.now();
    for (const v of vehicles) {
      const anim = animations ? animations.get(v.id) : null;

      let animDx = 0;
      let animDy = 0;
      let alpha  = 1;

      if (anim) {
        const elapsed = now - anim.startTime;
        const t = Math.min(elapsed / ANIM_DURATION, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

        animDx = anim.fromDx * (1 - ease);
        animDy = anim.fromDy * (1 - ease);

        if (anim.isExit) {
          if (t >= 1) {
            const extraT = Math.min((elapsed - ANIM_DURATION) / (ANIM_DURATION * 0.5), 1);
            animDx = anim.exitDx * extraT;
            animDy = anim.exitDy * extraT;
            alpha  = 1 - extraT;
          }
        } else if (anim.isPark) {
          // Park animation: vehicle slides up and then fades into the parking slot
          if (t >= 1) {
            const extraT = Math.min((elapsed - ANIM_DURATION) / (ANIM_DURATION * 0.4), 1);
            // Continue sliding upward into parking area, then fade
            animDy = anim.exitDy * extraT;
            alpha  = 1 - extraT;
          }
        }
      }

      // Skip fully-done vehicles (no anim running)
      if ((v.exited || v.parked) && !anim) continue;

      drawVehicle(ctx, v, cellSize, offsetX, offsetY, animDx, animDy, alpha);
    }
  }, [vehicles, passengers, parkingSpots, animations, cellSize, canvasWidth, canvasHeight, parkingAreaH, passengerAreaH, offsetY]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ── Tap / click handler ────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Scale for high-DPI display
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;

      // Translate to grid coordinates (subtract parking+passenger areas)
      const gridX = (x * scaleX - offsetX) / cellSize;
      const gridY = (y * scaleY - offsetY) / cellSize;

      const col = Math.floor(gridX);
      const row = Math.floor(gridY);

      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

      const vehicle = getVehicleAt(col, row, vehicles);
      if (vehicle) {
        onVehicleTap(vehicle.id);
      }
    },
    [vehicles, onVehicleTap, cellSize, canvasWidth, canvasHeight, offsetX, offsetY]
  );

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ width: canvasWidth, height: canvasHeight, touchAction: 'none', display: 'block' }}
      onPointerDown={handlePointerDown}
    />
  );
}
