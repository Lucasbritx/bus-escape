// ─── Sound Effects (Web Audio API, no external files) ────────────────────────
// AudioContext is created lazily on first user interaction to satisfy
// browser autoplay policies.

let _ctx = null;

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Slide: short rubbery swoosh (bus rolling across grid) ────────────────────
export function playSlide() {
  try {
    const ac = getCtx();
    const t  = ac.currentTime;

    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.14);

    gain.gain.setValueAtTime(0,    t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  } catch (_) {}
}

// ── Exit: ascending whoosh as bus flies off the board ────────────────────────
export function playExit() {
  try {
    const ac = getCtx();
    const t  = ac.currentTime;

    // Main sweep tone
    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.32);

    gain.gain.setValueAtTime(0,    t);
    gain.gain.linearRampToValueAtTime(0.20, t + 0.015);
    gain.gain.setValueAtTime(0.20, t + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.40);

    // High shimmer layer
    const osc2  = ac.createOscillator();
    const gain2 = ac.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(560, t + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(2000, t + 0.32);

    gain2.gain.setValueAtTime(0,    t + 0.06);
    gain2.gain.linearRampToValueAtTime(0.10, t + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc2.connect(gain2);
    gain2.connect(ac.destination);
    osc2.start(t + 0.06);
    osc2.stop(t + 0.40);
  } catch (_) {}
}

// ── Blocked: low thud when a tap doesn't move anything ───────────────────────
export function playBlocked() {
  try {
    const ac = getCtx();
    const t  = ac.currentTime;

    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.08);

    gain.gain.setValueAtTime(0,    t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  } catch (_) {}
}

// ── Park: satisfying mechanical click-clunk ───────────────────────────────────
export function playPark() {
  try {
    const ac = getCtx();
    const t  = ac.currentTime;

    // Thunk: low pitched impact
    const buf = ac.createBuffer(1, ac.sampleRate * 0.12, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.018));
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gainN = ac.createGain();
    gainN.gain.setValueAtTime(0.28, t);
    gainN.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(gainN); gainN.connect(ac.destination);
    src.start(t); src.stop(t + 0.13);

    // Click: short high pitched tone
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t); osc.stop(t + 0.10);
  } catch (_) {}
}

// ── Board: soft quick chime for passengers boarding ───────────────────────────
export function playBoard() {
  try {
    const ac = getCtx();
    const t  = ac.currentTime;

    // Two quick ascending notes
    [880, 1320].forEach((freq, i) => {
      const dt   = t + i * 0.07;
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, dt);
      gain.gain.setValueAtTime(0, dt);
      gain.gain.linearRampToValueAtTime(0.12, dt + 0.010);
      gain.gain.exponentialRampToValueAtTime(0.001, dt + 0.18);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(dt); osc.stop(dt + 0.20);
    });
  } catch (_) {}
}

// ── Game Over: low descending tones ──────────────────────────────────────────
export function playGameOver() {
  try {
    const ac = getCtx();
    // Three descending tones: G3 → E3 → C3
    const notes = [196.00, 164.81, 130.81];
    notes.forEach((freq, i) => {
      const t    = ac.currentTime + i * 0.22;
      const osc  = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.30);

      gain.gain.setValueAtTime(0,    t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.setValueAtTime(0.22, t + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.40);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.42);
    });
  } catch (_) {}
}

// ── Win: cheerful C-major arpeggio ───────────────────────────────────────────
export function playWin() {
  try {
    const ac    = getCtx();
    // C4  E4     G4     C5     E5
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];

    notes.forEach((freq, i) => {
      const t    = ac.currentTime + i * 0.11;
      const osc  = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0,    t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.015);
      gain.gain.setValueAtTime(0.22, t + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.30);
    });
  } catch (_) {}
}
