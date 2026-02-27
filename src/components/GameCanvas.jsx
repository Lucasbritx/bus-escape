import { useRef, useEffect, useCallback, useState } from 'react';
import { COLS, ROWS, buildGrid, slideVehicle, checkWin, getVehicleAt } from '../game/gameEngine.js';
import { drawVehicle, drawGrid } from '../game/drawVehicle.js';

const ANIM_DURATION = 280; // ms

/**
 * GameCanvas
 * Props:
 *   vehicles       – current vehicle list
 *   onVehicleTap   – (vehicleId) => void
 *   animations     – Map<vehicleId, AnimState>
 *   width          – canvas width in px
 */
export default function GameCanvas({ vehicles, onVehicleTap, animations, width }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const cellSize = Math.floor(width / COLS);
  const canvasWidth = cellSize * COLS;
  const canvasHeight = cellSize * ROWS;
  const offsetX = 0;
  const offsetY = 0;

  // ── Draw loop ──────────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawGrid(ctx, COLS, ROWS, cellSize, offsetX, offsetY);

    const now = performance.now();

    for (const v of vehicles) {
      const anim = animations ? animations.get(v.id) : null;

      let animDx = 0;
      let animDy = 0;
      let alpha = 1;

      if (anim) {
        const elapsed = now - anim.startTime;
        const t = Math.min(elapsed / ANIM_DURATION, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

        animDx = anim.fromDx * (1 - ease);
        animDy = anim.fromDy * (1 - ease);

        if (anim.isExit) {
          // After reaching destination, continue sliding off screen
          if (t >= 1) {
            // Continue exit animation: slide further off screen
            const extraT = Math.min((elapsed - ANIM_DURATION) / (ANIM_DURATION * 0.5), 1);
            const exitEase = extraT;
            animDx = anim.exitDx * exitEase;
            animDy = anim.exitDy * exitEase;
            alpha = 1 - exitEase;
          }
        }
      }

      // Don't draw fully-exited vehicles (animations handled above during exit)
      if (v.exited && !anim) continue;

      drawVehicle(ctx, v, cellSize, offsetX, offsetY, animDx, animDy, alpha);
    }
  }, [vehicles, animations, cellSize, canvasWidth, canvasHeight]);

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

      // Scale for high-DPI
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const cx = (x * scaleX - offsetX) / cellSize;
      const cy = (y * scaleY - offsetY) / cellSize;

      const col = Math.floor(cx);
      const row = Math.floor(cy);

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
