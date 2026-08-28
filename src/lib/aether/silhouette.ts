/**
 * Soft density fields for Form & Nerve.
 * Never stroke a diagram — only overlapping blobs and thin tubes of density.
 * Form: humans join a 7-slot circle, hands to hands, ring turning like play.
 * Nerve: brain hemispheres, cord, plexuses — a signal that remembers and fades.
 */

import { DEFAULT_FORM_DELAYS, FORM_DELAY_KEYS, type FormDelays } from "./types";

export const FORM_COUNTS = [1, 2, 3, 5, 7] as const;
const RING = 7;

interface Blob {
  x: number;
  y: number;
  r: number;
}

interface NervePath {
  pts: { x: number; y: number }[];
  r: number;
  core: boolean;
}

interface Person {
  slot: number;
  fade: number;
  targetFade: number;
  gate: number;
  phase: number;
}

export interface FieldSample {
  fx: number;
  fy: number;
  dens: number;
  tx: number;
  ty: number;
}

/** Torso-up human: head, neck, wide shoulders, chest. Legs are a soft wash. */
const TORSO: Blob[] = [
  { x: 0, y: 0.72, r: 0.12 },
  { x: -0.05, y: 0.7, r: 0.075 },
  { x: 0.05, y: 0.7, r: 0.075 },
  { x: 0, y: 0.6, r: 0.05 },
  { x: 0, y: 0.52, r: 0.026 },
  { x: -0.22, y: 0.42, r: 0.082 },
  { x: 0.22, y: 0.42, r: 0.082 },
  { x: -0.12, y: 0.42, r: 0.065 },
  { x: 0.12, y: 0.42, r: 0.065 },
  { x: 0, y: 0.4, r: 0.08 },
  { x: 0, y: 0.3, r: 0.13 },
  { x: -0.1, y: 0.29, r: 0.075 },
  { x: 0.1, y: 0.29, r: 0.075 },
  { x: 0, y: 0.18, r: 0.11 },
  { x: 0, y: 0.08, r: 0.09 },
  { x: 0, y: 0.0, r: 0.095 },
];

const LEGS: Blob[] = [
  { x: -0.06, y: -0.08, r: 0.085 },
  { x: 0.06, y: -0.08, r: 0.085 },
  { x: 0, y: -0.16, r: 0.11 },
];

const BODY = TORSO;

interface RingPose {
  slot: number;
  fade: number;
  z: number;
  s: number;
  x: number;
  y: number;
  cx: number;
  cy: number;
  sx: number;
  chestX: number;
  chestY: number;
  lShX: number;
  lShY: number;
  rShX: number;
  rShY: number;
  lHx: number;
  lHy: number;
  rHx: number;
  rHy: number;
  amp: number;
  lean: number;
}

const BRAIN: Blob[] = [
  { x: -0.14, y: 0.6, r: 0.115 },
  { x: -0.2, y: 0.54, r: 0.09 },
  { x: -0.1, y: 0.66, r: 0.08 },
  { x: -0.22, y: 0.62, r: 0.06 },
  { x: -0.08, y: 0.52, r: 0.055 },
  { x: -0.16, y: 0.48, r: 0.05 },
  { x: 0.14, y: 0.6, r: 0.115 },
  { x: 0.2, y: 0.54, r: 0.09 },
  { x: 0.1, y: 0.66, r: 0.08 },
  { x: 0.22, y: 0.62, r: 0.06 },
  { x: 0.08, y: 0.52, r: 0.055 },
  { x: 0.16, y: 0.48, r: 0.05 },
  { x: -0.09, y: 0.44, r: 0.055 },
  { x: 0.09, y: 0.44, r: 0.055 },
  { x: 0, y: 0.42, r: 0.04 },
  { x: 0, y: 0.37, r: 0.032 },
  { x: 0, y: 0.33, r: 0.026 },
];

function path(r: number, core: boolean, ...xy: number[]): NervePath {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < xy.length; i += 2) pts.push({ x: xy[i]!, y: xy[i + 1]! });
  return { pts, r, core };
}

const NERVES: NervePath[] = [
  path(0.038, true, 0, 0.32, 0, 0.2, 0, 0.08, 0, -0.04, 0, -0.18),
  path(0.024, true, 0, 0.42, 0, 0.32),
  path(0.016, false, -0.08, 0.56, -0.2, 0.6, -0.28, 0.56, -0.32, 0.5),
  path(0.016, false, 0.08, 0.56, 0.2, 0.6, 0.28, 0.56, 0.32, 0.5),
  path(0.014, false, -0.14, 0.5, -0.26, 0.48, -0.32, 0.4, -0.3, 0.32),
  path(0.014, false, 0.14, 0.5, 0.26, 0.48, 0.32, 0.4, 0.3, 0.32),
  path(0.012, false, -0.18, 0.62, -0.3, 0.66, -0.36, 0.62),
  path(0.012, false, 0.18, 0.62, 0.3, 0.66, 0.36, 0.62),
  path(0.011, false, -0.2, 0.52, -0.34, 0.52, -0.4, 0.46),
  path(0.011, false, 0.2, 0.52, 0.34, 0.52, 0.4, 0.46),
  path(0.022, true, 0, 0.24, -0.12, 0.23, -0.24, 0.2, -0.34, 0.08, -0.4, -0.06, -0.36, -0.18),
  path(0.022, true, 0, 0.24, 0.12, 0.23, 0.24, 0.2, 0.34, 0.08, 0.4, -0.06, 0.36, -0.18),
  path(0.012, false, -0.36, -0.18, -0.44, -0.22, -0.48, -0.18),
  path(0.012, false, -0.36, -0.18, -0.38, -0.26, -0.32, -0.28),
  path(0.01, false, -0.36, -0.18, -0.3, -0.26),
  path(0.012, false, 0.36, -0.18, 0.44, -0.22, 0.48, -0.18),
  path(0.012, false, 0.36, -0.18, 0.38, -0.26, 0.32, -0.28),
  path(0.01, false, 0.36, -0.18, 0.3, -0.26),
  path(0.014, false, 0, 0.16, -0.18, 0.16, -0.3, 0.12),
  path(0.014, false, 0, 0.08, -0.18, 0.07, -0.3, 0.02),
  path(0.014, false, 0, 0.0, -0.18, -0.02, -0.28, -0.08),
  path(0.014, false, 0, 0.16, 0.18, 0.16, 0.3, 0.12),
  path(0.014, false, 0, 0.08, 0.18, 0.07, 0.3, 0.02),
  path(0.014, false, 0, 0.0, 0.18, -0.02, 0.28, -0.08),
  path(0.024, true, 0, -0.12, -0.14, -0.2, -0.2, -0.36, -0.18, -0.54),
  path(0.024, true, 0, -0.12, 0.14, -0.2, 0.2, -0.36, 0.18, -0.54),
  path(0.016, false, -0.2, -0.36, -0.3, -0.44, -0.28, -0.56),
  path(0.016, false, 0.2, -0.36, 0.3, -0.44, 0.28, -0.56),
  path(0.012, false, -0.18, -0.54, -0.26, -0.58, -0.22, -0.62),
  path(0.012, false, 0.18, -0.54, 0.26, -0.58, 0.22, -0.62),
  path(0.013, false, 0, -0.18, -0.1, -0.22, -0.08, -0.32),
  path(0.013, false, 0, -0.18, 0.1, -0.22, 0.08, -0.32),
];

const GANGLIA: Blob[] = [
  { x: 0, y: 0.22, r: 0.028 },
  { x: 0, y: 0.12, r: 0.026 },
  { x: 0, y: 0.02, r: 0.026 },
  { x: 0, y: -0.08, r: 0.028 },
  { x: -0.06, y: 0.18, r: 0.018 },
  { x: 0.06, y: 0.18, r: 0.018 },
  { x: -0.06, y: 0.04, r: 0.018 },
  { x: 0.06, y: 0.04, r: 0.018 },
];

function slotPerson(slot: number, fade: number, gate = 0): Person {
  return {
    slot,
    fade,
    targetFade: gate > 0 ? 0 : 1,
    gate,
    phase: slot * 0.95,
  };
}

function crowdScale(n: number) {
  if (n <= 1) return 1.12;
  if (n <= 2) return 0.82;
  if (n <= 3) return 0.68;
  if (n <= 5) return 0.56;
  return 0.48;
}

function ringRadius(n: number) {
  if (n <= 1) return 0.02;
  if (n === 2) return 0.4;
  if (n === 3) return 0.52;
  if (n === 5) return 0.64;
  return 0.74;
}

class FlowGrid {
  cols = 160;
  rows = 90;
  cellW = 1;
  cellH = 1;
  dens = new Float32Array(0);
  fx = new Float32Array(0);
  fy = new Float32Array(0);
  tx = new Float32Array(0);
  ty = new Float32Array(0);

  resize(w: number, h: number) {
    this.cols = Math.max(96, Math.min(200, Math.round(w / 7)));
    this.rows = Math.max(64, Math.min(140, Math.round(h / 7)));
    this.cellW = w / this.cols;
    this.cellH = h / this.rows;
    const n = this.cols * this.rows;
    this.dens = new Float32Array(n);
    this.fx = new Float32Array(n);
    this.fy = new Float32Array(n);
    this.tx = new Float32Array(n);
    this.ty = new Float32Array(n);
  }

  clear() {
    this.dens.fill(0);
    this.fx.fill(0);
    this.fy.fill(0);
    this.tx.fill(0);
    this.ty.fill(0);
  }

  stamp(px: number, py: number, radius: number, amp: number, txx = 0, tyy = 0) {
    if (amp < 0.02 || radius < 0.4) return;
    const reach = radius * 2.6;
    const x0 = Math.max(0, Math.floor((px - reach) / this.cellW));
    const x1 = Math.min(this.cols - 1, Math.ceil((px + reach) / this.cellW));
    const y0 = Math.max(0, Math.floor((py - reach) / this.cellH));
    const y1 = Math.min(this.rows - 1, Math.ceil((py + reach) / this.cellH));
    const r2 = radius * radius;
    const inv = 1 / (r2 * 0.38);
    const cols = this.cols;
    for (let gy = y0; gy <= y1; gy++) {
      const wy = (gy + 0.5) * this.cellH;
      const dy = py - wy;
      for (let gx = x0; gx <= x1; gx++) {
        const wx = (gx + 0.5) * this.cellW;
        const dx = px - wx;
        const d2 = dx * dx + dy * dy;
        const g = Math.exp(-d2 * inv) * amp;
        if (g < 0.008) continue;
        const i = gy * cols + gx;
        this.dens[i]! += g;
        this.fx[i]! += dx * g;
        this.fy[i]! += dy * g;
        this.tx[i]! += txx * g;
        this.ty[i]! += tyy * g;
      }
    }
  }

  stampPath(pts: { x: number; y: number }[], radius: number, amp: number, tangentBoost: number) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const steps = Math.max(2, Math.ceil(len / (radius * 0.7)));
      const ux = dx / len;
      const uy = dy / len;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        this.stamp(a.x + dx * t, a.y + dy * t, radius, amp, ux * tangentBoost, uy * tangentBoost);
      }
    }
  }

  sample(x: number, y: number): FieldSample {
    const gx = x / this.cellW - 0.5;
    const gy = y / this.cellH - 0.5;
    const x0 = Math.max(0, Math.min(this.cols - 2, Math.floor(gx)));
    const y0 = Math.max(0, Math.min(this.rows - 2, Math.floor(gy)));
    const tx = gx - x0;
    const ty = gy - y0;
    const i00 = y0 * this.cols + x0;
    const i10 = i00 + 1;
    const i01 = i00 + this.cols;
    const i11 = i01 + 1;
    const lerp = (a: Float32Array, ia: number, ib: number, ic: number, id: number) => {
      const v0 = a[ia]! * (1 - tx) + a[ib]! * tx;
      const v1 = a[ic]! * (1 - tx) + a[id]! * tx;
      return v0 * (1 - ty) + v1 * ty;
    };
    return {
      dens: Math.min(1.6, lerp(this.dens, i00, i10, i01, i11)),
      fx: lerp(this.fx, i00, i10, i01, i11),
      fy: lerp(this.fy, i00, i10, i01, i11),
      tx: lerp(this.tx, i00, i10, i01, i11),
      ty: lerp(this.ty, i00, i10, i01, i11),
    };
  }
}

export class SilhouetteField {
  cx = 0;
  cy = 0;
  w = 1;
  h = 1;
  scale = 1;
  generation = 0;
  formCount = 1;
  seedFrom = 0;
  formRemain = 0;
  delays: FormDelays = { ...DEFAULT_FORM_DELAYS };
  private formClock = 0;
  private danceClock = 0;
  private nerveClock = 0;
  private nerveFade = 0;
  private nerveBloom = 0;
  private lifting = 0;
  private transcending = false;
  private countIndex = 0;
  private dissolving = false;
  private ringSpin = 0;
  private people: Person[] = [slotPerson(0, 1)];
  private grid = new FlowGrid();
  private dirty = true;

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.cx = w * 0.5;
    this.cy = h * 0.6;
    this.scale = Math.min(w * 0.5, h * 0.72);
    this.grid.resize(w, h);
    this.dirty = true;
  }

  setDelays(d: FormDelays) {
    this.delays = { ...d };
  }

  private holdNow() {
    const key = FORM_DELAY_KEYS[this.countIndex] ?? "t1";
    return Math.max(1.2, this.delays[key] ?? 4);
  }

  ensure(mode: "form" | "nerve") {
    if (mode === "form") {
      this.countIndex = 0;
      this.formCount = 1;
      this.people = [slotPerson(0, 1)];
      this.formClock = 0;
      this.dissolving = false;
      this.transcending = false;
      this.lifting = 0;
      this.seedFrom = 0;
      this.generation++;
      this.paintForm();
    } else {
      this.nerveFade = 1;
      this.nerveClock = 0;
      this.nerveBloom = 0;
      this.generation++;
      this.paintNerve();
    }
    this.dirty = false;
  }

  update(dt: number, mode: "form" | "nerve") {
    if (mode === "form") {
      this.formClock += dt;
      this.danceClock += dt;
      const n = Math.max(1, this.people.filter((p) => p.fade > 0.12 || p.targetFade > 0.5).length);
      const spinRate = n >= 7 ? 0.42 : n >= 5 ? 0.36 : n >= 3 ? 0.28 : n >= 2 ? 0.22 : 0.05;
      this.ringSpin += dt * spinRate;
      let seeded = false;
      for (const p of this.people) {
        if (p.slot === 0 && !this.dissolving) {
          p.targetFade = 1;
        }
        if (p.gate > 0) {
          p.gate -= dt;
          if (p.gate <= 0) {
            p.gate = 0;
            p.targetFade = 1;
            seeded = true;
          }
        }
        p.fade += (p.targetFade - p.fade) * Math.min(1, dt * 1.7);
      }
      if (seeded) {
        const idx = this.people.findIndex((p) => p.targetFade > 0.5 && p.fade < 0.35);
        this.seedFrom = idx < 0 ? Math.max(1, this.people.length - 1) : idx;
        this.generation++;
      }
      this.formRemain = this.dissolving ? 0 : Math.max(0, this.holdNow() - this.formClock);
      this.formCount = FORM_COUNTS[this.countIndex] ?? 1;
      if (this.transcending) {
        this.lifting = Math.min(1, this.lifting + dt * 0.32);
      } else {
        this.lifting += (0 - this.lifting) * Math.min(1, dt * 1.4);
      }
      if (this.dissolving) {
        const gone = this.people.every((p) => p.fade < 0.08);
        if (gone) {
          this.countIndex = 0;
          this.formCount = 1;
          this.people = [slotPerson(0, 0)];
          this.people[0]!.targetFade = 1;
          this.formClock = 0;
          this.dissolving = false;
          this.transcending = false;
          this.lifting = 0;
          this.seedFrom = 0;
          this.generation++;
        }
      } else if (this.formClock >= this.holdNow()) {
        this.advanceForm();
      }
      this.dirty = true;
    } else {
      this.nerveClock += dt;
      const cycle = 11;
      const p = this.nerveClock % cycle;
      const want = p < 5.2 ? 1 : p < 7.4 ? 1 : Math.max(0.18, 1 - (p - 7.4) / 2.4);
      this.nerveFade += (want - this.nerveFade) * Math.min(1, dt * 1.8);
      const waveY = 0.72 - ((this.nerveClock * 0.18) % 1.5) * 1.45;
      if (waveY < -0.5 && this.nerveFade > 0.7) {
        this.nerveBloom = Math.min(1, this.nerveBloom + dt * 2.4);
      } else {
        this.nerveBloom += (0 - this.nerveBloom) * Math.min(1, dt * 1.1);
      }
      this.dirty = true;
    }
    if (this.dirty) {
      if (mode === "form") this.paintForm();
      else this.paintNerve();
      this.dirty = false;
    }
  }

  setFormCount(n: number) {
    const idx = FORM_COUNTS.indexOf(n as (typeof FORM_COUNTS)[number]);
    if (idx < 0) return;
    this.countIndex = idx;
    this.formCount = n;
    this.people = Array.from({ length: n }, (_, i) => slotPerson(i, 1));
    this.dissolving = false;
    this.transcending = false;
    this.lifting = 0;
    this.formClock = 0.4;
    this.seedFrom = 0;
    this.generation++;
    this.paintForm();
    this.dirty = false;
  }

  private advanceForm() {
    const next = (this.countIndex + 1) % FORM_COUNTS.length;
    const n = FORM_COUNTS[next]!;
    if (n === 1) {
      for (const p of this.people) p.targetFade = 0;
      this.dissolving = true;
      this.transcending = true;
      this.lifting = 0;
      this.formClock = 0;
      return;
    }
    const prevLen = this.people.length;
    for (let i = prevLen; i < n; i++) {
      this.people.push(slotPerson(i, 0, (i - prevLen) * 0.7));
    }
    this.countIndex = next;
    this.formCount = n;
    this.formClock = 0;
    this.seedFrom = prevLen;
    this.generation++;
  }

  private ringPose(p: Person): RingPose {
    const n = Math.max(1, this.people.length);
    const a = -Math.PI / 2 + (p.slot / RING) * Math.PI * 2 + this.ringSpin;
    const step = n >= 2 ? Math.sin(this.danceClock * 3.15 + p.slot * 2.1) * 0.018 : 0;
    const rr = ringRadius(n);
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr * 0.52 + step;
    const z = Math.max(0.28, Math.min(1, 0.5 - Math.sin(a) * 0.38));
    const breath = 1 + Math.sin(this.danceClock * 1.12 + p.slot * 0.7) * 0.022;
    const s = crowdScale(n) * (p.slot === 0 ? 1.1 : 1) * breath;
    const persp = 0.74 + 0.34 * z;
    const sx = this.scale * s * persp;
    const lift = this.lifting * this.scale * (0.55 + p.slot * 0.04);
    const cx = this.cx + x * this.scale;
    const cy = this.cy - y * this.scale + (0.55 - z) * this.scale * 0.08 - lift;
    const amp = p.fade * (p.slot === 0 ? 1.15 : 1) * (0.82 + 0.28 * z);
    const lean = Math.max(-0.2, Math.min(0.2, -x * 0.28));
    const shY = cy - 0.4 * sx;
    const chestY = cy - 0.28 * sx;
    const lShX = cx + (-0.2 + lean * 0.4) * sx;
    const rShX = cx + (0.2 + lean * 0.4) * sx;
    return {
      slot: p.slot,
      fade: p.fade,
      z,
      s,
      x,
      y,
      cx,
      cy,
      sx,
      chestX: cx,
      chestY,
      lShX,
      lShY: shY,
      rShX,
      rShY: shY,
      lHx: lShX - 0.22 * sx,
      lHy: shY + 0.08 * sx,
      rHx: rShX + 0.22 * sx,
      rHy: shY + 0.08 * sx,
      amp,
      lean,
    };
  }

  private stampLimb(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    r: number,
    amp: number,
    flow: number,
  ) {
    this.grid.stampPath(
      [
        { x: x0, y: y0 },
        { x: (x0 + x1) * 0.5, y: (y0 + y1) * 0.5 },
        { x: x1, y: y1 },
      ],
      r,
      amp,
      flow,
    );
  }

  private stampPerson(pose: RingPose) {
    const sx = pose.sx;
    const lean = pose.lean;
    const wx = (lx: number, ly: number) => pose.cx + (lx + lean * ly) * sx;
    const wy = (ly: number) => pose.cy - ly * sx;
    for (const b of TORSO) {
      this.grid.stamp(wx(b.x, b.y), wy(b.y), b.r * sx * 1.06, pose.amp);
    }
    for (const b of LEGS) {
      this.grid.stamp(wx(b.x, b.y), wy(b.y), b.r * sx * 1.35, pose.amp * 0.32);
    }
    const crownX = wx(0, 0.78);
    const crownY = wy(0.78);
    this.grid.stamp(crownX, crownY, 0.16 * sx, pose.amp * 0.42);
    this.grid.stamp(crownX, crownY - 0.12 * sx, 0.22 * sx, pose.amp * 0.18);
    this.stampLimb(pose.lShX, pose.lShY, pose.lHx, pose.lHy, 0.042 * sx, pose.amp * 0.95, 36);
    this.stampLimb(pose.rShX, pose.rShY, pose.rHx, pose.rHy, 0.042 * sx, pose.amp * 0.95, 36);
    this.grid.stamp(pose.lHx, pose.lHy, 0.038 * sx, pose.amp);
    this.grid.stamp(pose.rHx, pose.rHy, 0.038 * sx, pose.amp);
  }

  private paintForm() {
    this.grid.clear();
    const pool = 0.1 + 0.04 * Math.sin(this.danceClock * 0.55);
    this.grid.stamp(this.cx, this.cy + this.scale * 0.08, this.scale * 1.15, pool);
    this.grid.stamp(this.cx, this.cy - this.scale * 0.1, this.scale * 0.82, pool * 0.55);
    const posed = this.people.filter((p) => p.fade > 0.03).map((p) => this.ringPose(p));
    posed.sort((a, b) => a.slot - b.slot);
    const live = posed.filter((p) => p.fade > 0.12);
    const closed = live.length >= RING;
    for (let i = 0; i < live.length; i++) {
      const a = live[i]!;
      const prev = live[i - 1];
      const next = live[i + 1];
      const wrap = closed ? live[0] : undefined;
      const wrapLast = closed ? live[live.length - 1] : undefined;
      if (prev) {
        a.lHx = (a.lShX + prev.rShX) * 0.5;
        a.lHy = (a.lShY + prev.rShY) * 0.5 + 8;
      } else if (wrapLast && a.slot === 0) {
        a.lHx = (a.lShX + wrapLast.rShX) * 0.5;
        a.lHy = (a.lShY + wrapLast.rShY) * 0.5 + 8;
      }
      if (next) {
        a.rHx = (a.rShX + next.lShX) * 0.5;
        a.rHy = (a.rShY + next.lShY) * 0.5 + 8;
      } else if (wrap && a.slot === live[live.length - 1]!.slot) {
        a.rHx = (a.rShX + wrap.lShX) * 0.5;
        a.rHy = (a.rShY + wrap.lShY) * 0.5 + 8;
      }
    }
    const draw = [...posed].sort((a, b) => a.z - b.z);
    for (const pose of draw) this.stampPerson(pose);
    for (let i = 0; i < live.length; i++) {
      const a = live[i]!;
      const b = live[i + 1];
      if (b) {
        const pulse = 0.7 + 0.3 * Math.sin(this.danceClock * 2.4 + i);
        this.grid.stampPath(
          [
            { x: a.rHx, y: a.rHy },
            { x: (a.rHx + b.lHx) * 0.5, y: (a.rHy + b.lHy) * 0.5 },
            { x: b.lHx, y: b.lHy },
          ],
          this.scale * 0.022,
          Math.min(a.fade, b.fade) * pulse,
          48,
        );
      }
    }
    if (closed && live.length >= 2) {
      const a = live[live.length - 1]!;
      const b = live[0]!;
      this.grid.stampPath(
        [
          { x: a.rHx, y: a.rHy },
          { x: (a.rHx + b.lHx) * 0.5, y: (a.rHy + b.lHy) * 0.5 },
          { x: b.lHx, y: b.lHy },
        ],
        this.scale * 0.022,
        Math.min(a.fade, b.fade) * 0.85,
        48,
      );
    }
    const arriving = posed.find((p) => p.fade > 0.04 && p.fade < 0.75);
    if (arriving && live.length >= 2) {
      const prev = live.find((p) => p.slot === arriving.slot - 1) ?? live[0]!;
      this.grid.stampPath(
        [
          { x: prev.rHx, y: prev.rHy },
          { x: (prev.chestX + arriving.chestX) * 0.5, y: (prev.chestY + arriving.chestY) * 0.5 },
          { x: arriving.lHx, y: arriving.lHy },
        ],
        this.scale * 0.02,
        arriving.fade * 0.9,
        40,
      );
    }
    if (this.transcending || this.lifting > 0.04) {
      const lift = Math.max(this.lifting, 0.04);
      const top = this.h * (0.9 - lift * 0.82);
      this.grid.stampPath(
        [
          { x: this.cx, y: this.h * 0.92 },
          { x: this.cx, y: (this.h * 0.92 + top) * 0.5 },
          { x: this.cx, y: top },
        ],
        this.scale * (0.045 + lift * 0.04),
        0.28 + lift * 0.55,
        -90,
      );
      this.grid.stamp(this.cx, top, this.scale * (0.12 + lift * 0.2), 0.25 + lift * 0.45);
      const ring = this.scale * (0.35 + lift * 0.7);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + this.danceClock * 0.4;
        this.grid.stamp(this.cx + Math.cos(a) * ring, this.cy - Math.sin(a) * ring * 0.45 - lift * this.scale * 0.3, this.scale * 0.08, 0.12 + lift * 0.2);
      }
    }
  }

  private worldX(lx: number) {
    return this.cx + lx * this.w * 0.52;
  }

  private worldY(ly: number) {
    const t = (0.74 - ly) / 1.42;
    return this.h * (0.06 + t * 0.88);
  }

  private paintNerve() {
    this.grid.clear();
    const fade = this.nerveFade;
    const pulse = 0.88 + 0.12 * Math.sin(this.nerveClock * 1.05);
    const bloom = this.nerveBloom;
    const waveY = 0.72 - ((this.nerveClock * 0.18) % 1.5) * 1.45;
    const sx = Math.min(this.w * 0.42, this.h * 0.55);

    this.grid.stamp(this.cx, this.h * 0.5, Math.min(this.w, this.h) * 0.48, 0.08 + bloom * 0.12);

    const bodyAmp = fade * (0.3 + bloom * 0.6);
    for (const b of BODY) {
      this.grid.stamp(this.worldX(b.x * 0.92), this.worldY(b.y), b.r * sx * 1.2, bodyAmp);
    }
    for (const b of LEGS) {
      this.grid.stamp(this.worldX(b.x * 0.92), this.worldY(b.y), b.r * sx * 1.45, bodyAmp * 0.5);
    }

    for (const b of BRAIN) {
      const near = Math.exp(-((b.y - waveY) * (b.y - waveY)) * 8);
      const amp = fade * pulse * (1.05 + near * 0.7 + bloom * 0.45);
      this.grid.stamp(this.worldX(b.x), this.worldY(b.y), b.r * sx * 1.02, amp);
    }
    const crownX = this.worldX(0);
    const crownY = this.worldY(0.66);
    this.grid.stamp(crownX, crownY, sx * 0.16, fade * (0.28 + bloom * 0.35));
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * 0.1 - (i / 10) * Math.PI * 0.8;
      const reach = this.w * (0.16 + 0.14 * (0.5 + 0.5 * Math.sin(this.nerveClock * 0.45 + i)));
      const fire = 0.24 + 0.2 * Math.sin(this.nerveClock * 1.6 + i * 0.7) + bloom * 0.22;
      this.grid.stampPath(
        [
          { x: crownX, y: crownY },
          { x: crownX + Math.cos(a) * reach * 0.45, y: crownY + Math.sin(a) * reach * 0.55 },
          { x: crownX + Math.cos(a) * reach, y: crownY + Math.sin(a) * reach * 0.72 },
        ],
        sx * 0.018,
        fade * fire,
        52,
      );
    }

    for (const g of GANGLIA) {
      const near = Math.exp(-((g.y - waveY) * (g.y - waveY)) * 10);
      this.grid.stamp(this.worldX(g.x), this.worldY(g.y), g.r * sx * 1.25, fade * (1 + near * 1.2 + bloom * 0.4));
    }
    for (const n of NERVES) {
      const midY = n.pts.reduce((s, p) => s + p.y, 0) / n.pts.length;
      const dist = Math.abs(midY - waveY);
      const fire = n.core ? 1.15 + Math.exp(-dist * 6) * 1.05 : 0.72 + Math.exp(-dist * 7) * 1.45;
      const pts = n.pts.map((p) => ({ x: this.worldX(p.x * 1.22), y: this.worldY(p.y) }));
      this.grid.stampPath(pts, n.r * sx * (n.core ? 1.35 : 1.12), fade * pulse * fire, n.core ? 36 : 58);
    }

    const outer = 0.14 + bloom * 0.1;
    for (const b of BRAIN) {
      this.grid.stamp(this.cx + b.x * this.w * 0.72, this.worldY(b.y) * 0.85 + this.h * 0.04, b.r * sx * 1.8, fade * outer);
    }
    this.grid.stampPath(
      [
        { x: this.cx, y: this.worldY(0.32) },
        { x: this.cx, y: this.h * 0.55 },
        { x: this.cx, y: this.h * 0.88 },
      ],
      sx * 0.03,
      fade * (0.18 + bloom * 0.2),
      22,
    );
  }

  sample(x: number, y: number): FieldSample {
    return this.grid.sample(x, y);
  }

  randomPointInActive(mode: "form" | "nerve", index = 0): { x: number; y: number } | null {
    if (mode === "form") {
      const live = this.people.filter((p) => p.targetFade > 0.5 || p.fade > 0.25);
      if (!live.length) return null;
      const from = Math.min(this.seedFrom, Math.max(0, live.length - 1));
      const pool = live.slice(from);
      const src = (pool.length ? pool : live)[index % (pool.length || live.length)]!;
      const pose = this.ringPose(src);
      const b = TORSO[Math.floor(Math.random() * TORSO.length)]!;
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * b.r * 0.55;
      const lx = b.x + Math.cos(ang) * rad;
      const ly = b.y + Math.sin(ang) * rad;
      return {
        x: pose.cx + (lx + pose.lean * ly) * pose.sx,
        y: pose.cy - ly * pose.sx,
      };
    }
    if (Math.random() < 0.32) {
      const b = BRAIN[Math.floor(Math.random() * BRAIN.length)]!;
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * b.r * 0.65;
      return {
        x: this.worldX(b.x + Math.cos(ang) * rad),
        y: this.worldY(b.y + Math.sin(ang) * rad),
      };
    }
    if (Math.random() < 0.12) {
      const g = GANGLIA[Math.floor(Math.random() * GANGLIA.length)]!;
      return { x: this.worldX(g.x), y: this.worldY(g.y) };
    }
    const n = NERVES[Math.floor(Math.random() * NERVES.length)]!;
    const i = Math.floor(Math.random() * (n.pts.length - 1));
    const a = n.pts[i]!;
    const b = n.pts[i + 1]!;
    const t = Math.random();
    const lx = a.x + (b.x - a.x) * t;
    const ly = a.y + (b.y - a.y) * t;
    return { x: this.worldX(lx * 1.18), y: this.worldY(ly) };
  }
}
