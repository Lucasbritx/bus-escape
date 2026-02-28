// ─── Canvas Drawing Helpers ──────────────────────────────────────────────────

const VEHICLE_COLORS = {
  red:    '#e74c3c',
  green:  '#2ecc71',
  blue:   '#3498db',
  purple: '#9b59b6',
  yellow: '#f1c40f',
  teal:   '#1abc9c',
  pink:   '#e91e8c',
  orange: '#f39c12',
  indigo: '#5c6bc0',
  lime:   '#8bc34a',
};

export const COLOR_KEYS = Object.keys(VEHICLE_COLORS);

export function getColor(key) {
  return VEHICLE_COLORS[key] || '#888';
}

/** Darken a hex color by a factor (0-1) */
function darken(hex, factor = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - factor)) | 0;
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - factor)) | 0;
  const b = Math.max(0, (n & 0xff) * (1 - factor)) | 0;
  return `rgb(${r},${g},${b})`;
}

/** Draw a rounded rectangle */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Draw a directional arrow polygon centered at (cx, cy).
 *  Base shape points RIGHT; rotate for other directions. */
function drawArrow(ctx, cx, cy, dir, size) {
  ctx.save();
  ctx.translate(cx, cy);
  const rotations = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  ctx.rotate(rotations[dir] || 0);

  // 7-point arrow pointing RIGHT at rotation=0
  const tipX  =  size * 0.45;   // rightmost tip
  const headH =  size * 0.46;   // half-height of arrowhead triangle
  const neckX =  0;              // where head meets shaft (vertical divider)
  const shaftH = size * 0.20;   // half-height of shaft
  const tailX  = -size * 0.45;  // leftmost end of shaft

  ctx.beginPath();
  ctx.moveTo(tipX,   0);         // 1: tip (rightmost)
  ctx.lineTo(neckX, -headH);     // 2: upper corner of arrowhead
  ctx.lineTo(neckX, -shaftH);    // 3: upper junction head↔shaft
  ctx.lineTo(tailX, -shaftH);    // 4: upper-left of shaft
  ctx.lineTo(tailX,  shaftH);    // 5: lower-left of shaft
  ctx.lineTo(neckX,  shaftH);    // 6: lower junction head↔shaft
  ctx.lineTo(neckX,  headH);     // 7: lower corner of arrowhead
  ctx.closePath();

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a single vehicle on the canvas, styled as a cartoon bus.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} vehicle   - vehicle data object
 * @param {number} cellSize  - size of one grid cell in px
 * @param {number} offsetX   - canvas x-offset for the grid
 * @param {number} offsetY   - canvas y-offset for the grid
 * @param {number} animDx    - animation x-offset in px (for slide animation)
 * @param {number} animDy    - animation y-offset in px
 * @param {number} alpha     - opacity (for exit fade)
 */
export function drawVehicle(ctx, vehicle, cellSize, offsetX, offsetY, animDx = 0, animDy = 0, alpha = 1) {
  if (vehicle.exited && alpha <= 0) return;

  const pad = cellSize * 0.06;
  const r   = cellSize * 0.11;   // smaller radius = more boxy/bus-like

  // Bounding box from cells
  const cols   = vehicle.cells.map(([c]) => c);
  const rows   = vehicle.cells.map(([, row]) => row);
  const minCol = Math.min(...cols),  maxCol = Math.max(...cols);
  const minRow = Math.min(...rows),  maxRow = Math.max(...rows);

  const bx = offsetX + minCol * cellSize + pad + animDx;
  const by = offsetY + minRow * cellSize + pad + animDy;
  const bw = (maxCol - minCol + 1) * cellSize - pad * 2;
  const bh = (maxRow - minRow + 1) * cellSize - pad * 2;

  const baseColor   = getColor(vehicle.color);
  const borderColor = darken(baseColor, 0.30);
  const shadowColor = darken(baseColor, 0.55);

  const dir     = vehicle.direction;
  const isHoriz = dir === 'left' || dir === 'right';

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── Wheels (drawn before body so the bus covers their inner halves) ───────
  const wR  = cellSize * 0.125;  // tire outer radius
  const wRi = wR * 0.60;         // rim radius
  const wRd = wR * 0.24;         // center hub dot

  // Front and rear axle positions (20% / 80% along the length)
  let wheelCenters;
  if (isHoriz) {
    const x1 = bx + bw * 0.22, x2 = bx + bw * 0.78;
    wheelCenters = [
      { x: x1, y: by },       { x: x2, y: by },       // top edge
      { x: x1, y: by + bh },  { x: x2, y: by + bh },  // bottom edge
    ];
  } else {
    const y1 = by + bh * 0.22, y2 = by + bh * 0.78;
    wheelCenters = [
      { x: bx,      y: y1 },  { x: bx,      y: y2 },  // left edge
      { x: bx + bw, y: y1 },  { x: bx + bw, y: y2 },  // right edge
    ];
  }

  for (const { x, y } of wheelCenters) {
    // Tire (dark rubber)
    ctx.beginPath(); ctx.arc(x, y, wR, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a'; ctx.fill();
    // Rim (silver)
    ctx.beginPath(); ctx.arc(x, y, wRi, 0, Math.PI * 2);
    ctx.fillStyle = '#cecece'; ctx.fill();
    // Hub highlight
    ctx.beginPath(); ctx.arc(x - wRi * 0.18, y - wRi * 0.18, wRi * 0.30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
    // Center bolt
    ctx.beginPath(); ctx.arc(x, y, wRd, 0, Math.PI * 2);
    ctx.fillStyle = '#888'; ctx.fill();
  }

  // ── Drop shadow ──────────────────────────────────────────────────────────
  ctx.shadowColor   = shadowColor;
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, bx, by, bw, bh, r);
  ctx.fillStyle = baseColor;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

  // ── Vertical gradient (light top → slight shadow bottom) ────────────────
  ctx.save();
  roundRect(ctx, bx, by, bw, bh, r);
  ctx.clip();
  const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
  grad.addColorStop(0,   'rgba(255,255,255,0.28)');
  grad.addColorStop(0.45,'rgba(255,255,255,0.04)');
  grad.addColorStop(1,   'rgba(0,0,0,0.10)');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, bw, bh);
  ctx.restore();

  // ── Border ───────────────────────────────────────────────────────────────
  roundRect(ctx, bx, by, bw, bh, r);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth   = cellSize * 0.045;
  ctx.stroke();

  // ── Bus details ──────────────────────────────────────────────────────────
  const ip      = cellSize * 0.10;  // inner padding
  const wr      = r * 0.55;         // window corner radius

  // Draws a bus window with a blue tint and glare highlight
  function busWindow(x, y, w, h) {
    roundRect(ctx, x, y, w, h, wr);
    ctx.fillStyle = 'rgba(160,210,255,0.72)';
    ctx.fill();
    // glare streak
    roundRect(ctx, x + w * 0.08, y + h * 0.10, w * 0.38, h * 0.28, wr * 0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
    roundRect(ctx, x, y, w, h, wr);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  if (isHoriz) {
    // ── Windshield at the front ────────────────────────────────────────────
    const wsW = Math.min(bw * 0.28, cellSize * 0.70);
    const wsH = bh * 0.60;
    const wsY = by + (bh - wsH) / 2;
    const wsX = dir === 'right' ? bx + bw - ip - wsW : bx + ip;
    busWindow(wsX, wsY, wsW, wsH);

    // ── Passenger windows along the body ──────────────────────────────────
    const bodyX    = dir === 'right' ? bx + ip          : bx + ip + wsW + ip;
    const bodyEndX = dir === 'right' ? bx + bw - ip - wsW - ip : bx + bw - ip;
    const avail    = Math.max(0, bodyEndX - bodyX);
    const winH_    = bh * 0.44;
    const winY_    = by + (bh - winH_) / 2;
    const winW_    = cellSize * 0.26;
    const winGap_  = ip * 0.65;
    const nW       = Math.max(1, Math.floor((avail + winGap_) / (winW_ + winGap_)));
    const totalW_  = nW * winW_ + (nW - 1) * winGap_;
    const startWX  = bodyX + Math.max(0, (avail - totalW_) / 2);
    for (let i = 0; i < nW; i++) {
      busWindow(startWX + i * (winW_ + winGap_), winY_, winW_, winH_);
    }

    // ── Headlights (front corners) ─────────────────────────────────────────
    const hlR = cellSize * 0.068;
    const hlX = dir === 'right' ? bx + bw - ip * 0.50 : bx + ip * 0.50;
    ctx.beginPath(); ctx.arc(hlX, by + bh * 0.25, hlR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,180,0.95)'; ctx.fill();
    ctx.beginPath(); ctx.arc(hlX, by + bh * 0.75, hlR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,120,80,0.90)';  ctx.fill(); // tail light opposite side

  } else {
    // ── Windshield at the front ────────────────────────────────────────────
    const wsH_ = Math.min(bh * 0.28, cellSize * 0.70);
    const wsW_ = bw * 0.60;
    const wsX_ = bx + (bw - wsW_) / 2;
    const wsY_ = dir === 'down' ? by + bh - ip - wsH_ : by + ip;
    busWindow(wsX_, wsY_, wsW_, wsH_);

    // ── Passenger windows along the body ──────────────────────────────────
    const bodyY    = dir === 'down' ? by + ip              : by + ip + wsH_ + ip;
    const bodyEndY = dir === 'down' ? by + bh - ip - wsH_ - ip : by + bh - ip;
    const avail_   = Math.max(0, bodyEndY - bodyY);
    const winW__   = bw * 0.44;
    const winX__   = bx + (bw - winW__) / 2;
    const winH__   = cellSize * 0.26;
    const winGap__ = ip * 0.65;
    const nW_      = Math.max(1, Math.floor((avail_ + winGap__) / (winH__ + winGap__)));
    const totalH_  = nW_ * winH__ + (nW_ - 1) * winGap__;
    const startWY  = bodyY + Math.max(0, (avail_ - totalH_) / 2);
    for (let i = 0; i < nW_; i++) {
      busWindow(winX__, startWY + i * (winH__ + winGap__), winW__, winH__);
    }

    // ── Headlights (front corners) ─────────────────────────────────────────
    const hlR_ = cellSize * 0.068;
    const hlY_ = dir === 'down' ? by + bh - ip * 0.50 : by + ip * 0.50;
    ctx.beginPath(); ctx.arc(bx + bw * 0.25, hlY_, hlR_, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,180,0.95)'; ctx.fill();
    ctx.beginPath(); ctx.arc(bx + bw * 0.75, hlY_, hlR_, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,180,0.95)'; ctx.fill();
  }

  // ── Direction arrow (centered on body, not overlapping windshield) ───────
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  drawArrow(ctx, cx, cy, vehicle.direction, Math.min(bw, bh) * 0.36);

  ctx.restore();
}

/**
 * Draw the parking area (above the grid).
 * Each slot is a colored angled bay with a small bus icon when occupied.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} parkingSpots  - array of { color, occupiedBy? } | null  (length = COLS)
 * @param {object[]} vehicles   - full vehicle list (to look up parked vehicles)
 * @param {number} cellSize
 * @param {number} offsetX      - same offsetX as grid
 * @param {number} offsetY      - TOP of the parking area (above the grid)
 * @param {number} areaH        - height of the parking area in px
 */
export function drawParkingArea(ctx, parkingSpots, vehicles, cellSize, offsetX, offsetY, areaH) {
  const slotW = cellSize;
  const slotH = areaH * 0.82;
  const slotY = offsetY + (areaH - slotH) / 2;
  const skew  = 6; // px slant on each side for angled bay look

  ctx.save();

  for (let col = 0; col < parkingSpots.length; col++) {
    const spot = parkingSpots[col];
    const slotX = offsetX + col * cellSize;
    const cx    = slotX + slotW / 2;

    if (!spot) {
      // Empty non-parking column: subtle dark indent
      ctx.beginPath();
      ctx.moveTo(slotX + skew,       slotY);
      ctx.lineTo(slotX + slotW - skew, slotY);
      ctx.lineTo(slotX + slotW,      slotY + slotH);
      ctx.lineTo(slotX,              slotY + slotH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fill();
      continue;
    }

    const baseColor = getColor(spot.color);
    const darkColor = darken(baseColor, 0.35);
    const isOccupied = !!spot.occupiedBy;

    // Bay background
    ctx.beginPath();
    ctx.moveTo(slotX + skew,       slotY);
    ctx.lineTo(slotX + slotW - skew, slotY);
    ctx.lineTo(slotX + slotW,      slotY + slotH);
    ctx.lineTo(slotX,              slotY + slotH);
    ctx.closePath();

    if (isOccupied) {
      // Filled with vehicle color
      ctx.fillStyle = baseColor;
      ctx.fill();
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Small vehicle icon: rounded rectangle in center
      const iw = slotW * 0.58, ih = slotH * 0.48;
      const ix = cx - iw / 2, iy = slotY + (slotH - ih) / 2;
      roundRect(ctx, ix, iy, iw, ih, 4);
      ctx.fillStyle = darken(baseColor, 0.18);
      ctx.fill();
      // Tiny windshield
      roundRect(ctx, ix + iw * 0.60, iy + ih * 0.20, iw * 0.28, ih * 0.60, 2);
      ctx.fillStyle = 'rgba(160,210,255,0.80)';
      ctx.fill();
      // Checkmark overlay
      ctx.strokeStyle = 'rgba(255,255,255,0.90)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - slotW * 0.14, slotY + slotH * 0.56);
      ctx.lineTo(cx - slotW * 0.03, slotY + slotH * 0.70);
      ctx.lineTo(cx + slotW * 0.17, slotY + slotH * 0.38);
      ctx.stroke();
    } else {
      // Empty slot: subtle gradient fill
      const grad = ctx.createLinearGradient(slotX, slotY, slotX, slotY + slotH);
      grad.addColorStop(0, `${baseColor}55`);
      grad.addColorStop(1, `${baseColor}22`);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Color dot in center
      ctx.beginPath();
      ctx.arc(cx, slotY + slotH * 0.50, slotW * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = `${baseColor}99`;
      ctx.fill();
    }

    // Lane lines on either side of occupied spots
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(slotX, slotY); ctx.lineTo(slotX, slotY + slotH);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw one stickman passenger centered at (px, baseY).
 * baseY is the bottom of the feet.
 * scale controls the total height.
 */
function drawPassenger(ctx, px, baseY, scale, baseColor, boarded) {
  ctx.save();
  ctx.globalAlpha = boarded ? 0.28 : 1.0;

  const skinColor  = '#f5cba7';
  const darkColor  = darken(baseColor, 0.28);
  const lw         = Math.max(1.2, scale * 0.095); // limb stroke width

  // ── proportions (all relative to scale = total body height) ──────────────
  const headR      = scale * 0.220;  // head radius
  const headCY     = baseY - scale + headR;          // head centre Y

  const neckY      = headCY + headR;                 // top of torso
  const hipY       = neckY + scale * 0.310;          // hip joint
  const torsoMidY  = (neckY + hipY) / 2;

  // shoulders
  const shoulderY  = neckY + scale * 0.07;
  const shoulderX  = scale * 0.22;

  // elbow (arms angled outward and slightly down)
  const elbowX     = shoulderX + scale * 0.20;
  const elbowY     = shoulderY + scale * 0.13;

  // wrist / hand
  const wristX     = elbowX + scale * 0.10;
  const wristY     = elbowY + scale * 0.10;

  // knees
  const kneeX      = scale * 0.10;
  const kneeY      = hipY + scale * 0.14;

  // feet
  const footX      = kneeX + scale * 0.04;
  // footY = baseY

  // ── Shirt / torso (filled oval) ───────────────────────────────────────────
  ctx.beginPath();
  ctx.ellipse(
    px, torsoMidY,
    scale * 0.155, (hipY - neckY) * 0.52,
    0, 0, Math.PI * 2
  );
  ctx.fillStyle = baseColor;
  ctx.fill();

  // ── Legs ─────────────────────────────────────────────────────────────────
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;

  // Trousers (slightly darker)
  ctx.strokeStyle = darkColor;

  // Left leg: hip → knee → foot
  ctx.beginPath();
  ctx.moveTo(px, hipY);
  ctx.lineTo(px - kneeX, kneeY);
  ctx.lineTo(px - footX, baseY);
  ctx.stroke();

  // Right leg
  ctx.beginPath();
  ctx.moveTo(px, hipY);
  ctx.lineTo(px + kneeX, kneeY);
  ctx.lineTo(px + footX, baseY);
  ctx.stroke();

  // ── Arms ─────────────────────────────────────────────────────────────────
  ctx.strokeStyle = baseColor;

  // Left arm
  ctx.beginPath();
  ctx.moveTo(px - scale * 0.08, shoulderY);
  ctx.lineTo(px - elbowX, elbowY);
  ctx.lineTo(px - wristX, wristY);
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(px + scale * 0.08, shoulderY);
  ctx.lineTo(px + elbowX, elbowY);
  ctx.lineTo(px + wristX, wristY);
  ctx.stroke();

  // ── Neck ─────────────────────────────────────────────────────────────────
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = lw * 0.85;
  ctx.beginPath();
  ctx.moveTo(px, neckY);
  ctx.lineTo(px, headCY + headR * 0.5);
  ctx.stroke();

  // ── Head ─────────────────────────────────────────────────────────────────
  // Shadow
  ctx.beginPath();
  ctx.arc(px + 1, headCY + 1.5, headR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();

  // Skin fill
  ctx.beginPath();
  ctx.arc(px, headCY, headR, 0, Math.PI * 2);
  ctx.fillStyle = skinColor;
  ctx.fill();

  // Hair band (colored cap matching the team color)
  ctx.beginPath();
  ctx.arc(px, headCY, headR, Math.PI * 1.15, Math.PI * 1.85);
  ctx.lineTo(px, headCY);
  ctx.closePath();
  ctx.fillStyle = baseColor;
  ctx.fill();

  // Face: two eyes
  const eyeR  = headR * 0.155;
  const eyeOX = headR * 0.32;
  const eyeY  = headCY - headR * 0.08;
  ctx.fillStyle = '#2c2c2c';
  ctx.beginPath(); ctx.arc(px - eyeOX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + eyeOX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

  // Eye shine
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.beginPath(); ctx.arc(px - eyeOX + eyeR * 0.35, eyeY - eyeR * 0.35, eyeR * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(px + eyeOX + eyeR * 0.35, eyeY - eyeR * 0.35, eyeR * 0.38, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = Math.max(0.8, headR * 0.12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(px, headCY + headR * 0.10, headR * 0.35, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // Head outline
  ctx.strokeStyle = darken(skinColor, 0.20);
  ctx.lineWidth = Math.max(0.8, headR * 0.10);
  ctx.beginPath();
  ctx.arc(px, headCY, headR, 0, Math.PI * 2);
  ctx.stroke();

  // ── Boarded: checkmark badge ───────────────────────────────────────────────
  if (boarded) {
    const bR = headR * 0.70;
    const bX = px + headR * 0.80;
    const bY = headCY - headR * 0.80;

    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(bX, bY, bR, 0, Math.PI * 2);
    ctx.fillStyle = '#27ae60'; ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1, bR * 0.38);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bX - bR * 0.45, bY + bR * 0.05);
    ctx.lineTo(bX - bR * 0.05, bY + bR * 0.45);
    ctx.lineTo(bX + bR * 0.50, bY - bR * 0.38);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw the passenger queue row (between parking area and grid).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object[]} passengers  - array of { id, color, boarded }
 * @param {number} cellSize
 * @param {number} offsetX
 * @param {number} offsetY       - TOP of the passenger row
 * @param {number} areaH         - height of passenger area in px
 * @param {number} totalCols     - number of grid columns (to determine total width)
 */
export function drawPassengerQueue(ctx, passengers, cellSize, offsetX, offsetY, areaH, totalCols) {
  const totalW  = totalCols * cellSize;
  const baseY   = offsetY + areaH * 0.96; // feet sit near the bottom of the strip

  // Background strip
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(offsetX, offsetY, totalW, areaH);

  const n = passengers.length;
  if (n === 0) { ctx.restore(); return; }

  // Scale so every passenger fits in areaH with a little breathing room
  const maxScale = areaH * 0.88;
  const slotW    = totalW / n;
  const scale    = Math.min(maxScale, slotW * 0.72);

  for (let i = 0; i < n; i++) {
    const p  = passengers[i];
    const px = offsetX + slotW * (i + 0.5);
    drawPassenger(ctx, px, baseY, scale, getColor(p.color), p.boarded);
  }

  ctx.restore();
}

/**
 * Draw the grid background.
 */
export function drawGrid(ctx, cols, rows, cellSize, offsetX, offsetY) {
  // Background
  ctx.fillStyle = '#b0b8c1';
  ctx.fillRect(offsetX, offsetY, cols * cellSize, rows * cellSize);

  // Cell separators
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + c * cellSize, offsetY);
    ctx.lineTo(offsetX + c * cellSize, offsetY + rows * cellSize);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + r * cellSize);
    ctx.lineTo(offsetX + cols * cellSize, offsetY + r * cellSize);
    ctx.stroke();
  }
}
