import { DEFAULT_FORM_DELAYS, PALETTES, type FormDelays, type PaletteId, type WindMode } from "./types";
import { SilhouetteField } from "./silhouette";

const BASE = 6200;

type RGB = [number, number, number];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

export interface EngineParams {
  density: number;
  flow: number;
  trail: number;
  thickness: number;
  mode: WindMode;
  palette: PaletteId;
  paused: boolean;
  formDelays: FormDelays;
  relayFade: number;
}

export class ParticleEngine {
  w = 1;
  h = 1;
  private n = 0;
  private x = new Float32Array(0);
  private y = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private life = new Float32Array(0);
  private maxL = new Float32Array(0);
  private size = new Float32Array(0);
  private ang = new Float32Array(0);
  private len = new Float32Array(0);
  private col = new Uint8Array(0);
  private dens = new Float32Array(0);

  silhouette = new SilhouetteField();
  time = 0;
  private lastGen = -1;
  params: EngineParams = {
    density: 1,
    flow: 0.55,
    trail: 0.09,
    thickness: 0.45,
    mode: "drift",
    palette: "solar",
    paused: false,
    formDelays: { ...DEFAULT_FORM_DELAYS },
    relayFade: 1.6,
  };
  pointer = { x: 0, y: 0, px: 0, py: 0, down: false, force: 0 };
  private seeded = false;
  private mix = 1;
  private fromBg: RGB = [...PALETTES.solar.bg];
  private fromColors: RGB[] = PALETTES.solar.colors.map((c) => [...c] as RGB);

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.silhouette.resize(w, h);
    this.rebuild();
    this.seeded = true;
  }

  setParams(p: Partial<EngineParams>) {
    const prev = this.params.mode;
    if (p.palette && p.palette !== this.params.palette) {
      const cur = this.displayPalette();
      this.fromBg = [...cur.bg];
      this.fromColors = cur.colors.map((c) => [...c] as RGB);
      this.mix = 0;
    }
    Object.assign(this.params, p);
    if (p.formDelays) this.silhouette.setDelays(p.formDelays);
    if (p.density !== undefined) this.rebuild();
    if (p.mode && p.mode !== prev) {
      if (p.mode === "form" || p.mode === "nerve") {
        this.silhouette.ensure(p.mode);
        this.lastGen = this.silhouette.generation;
        this.rebuild();
        this.seedIntoSilhouette(p.mode, 1);
      } else {
        this.rebuild();
      }
    }
  }

  private targetCount() {
    const area = Math.min(this.w, this.h) / 900;
    let m = this.params.density;
    if (this.params.mode === "form") {
      m *= 1.72 + 0.16 * Math.max(0, this.silhouette.formCount - 1);
    } else if (this.params.mode === "nerve") {
      m *= 1.62;
    }
    return Math.max(500, Math.min(16000, Math.floor(BASE * m * Math.max(0.45, area))));
  }

  private rebuild() {
    const want = this.targetCount();
    if (this.n === want && this.x.length >= want) return;
    const nx = new Float32Array(want);
    const ny = new Float32Array(want);
    const nvx = new Float32Array(want);
    const nvy = new Float32Array(want);
    const nl = new Float32Array(want);
    const nm = new Float32Array(want);
    const ns = new Float32Array(want);
    const na = new Float32Array(want);
    const nlen = new Float32Array(want);
    const nc = new Uint8Array(want);
    const nd = new Float32Array(want);
    const copy = Math.min(this.n, want);
    if (copy) {
      nx.set(this.x.subarray(0, copy));
      ny.set(this.y.subarray(0, copy));
      nvx.set(this.vx.subarray(0, copy));
      nvy.set(this.vy.subarray(0, copy));
      nl.set(this.life.subarray(0, copy));
      nm.set(this.maxL.subarray(0, copy));
      ns.set(this.size.subarray(0, copy));
      na.set(this.ang.subarray(0, copy));
      nlen.set(this.len.subarray(0, copy));
      nc.set(this.col.subarray(0, copy));
      nd.set(this.dens.subarray(0, copy));
    }
    this.x = nx;
    this.y = ny;
    this.vx = nvx;
    this.vy = nvy;
    this.life = nl;
    this.maxL = nm;
    this.size = ns;
    this.ang = na;
    this.len = nlen;
    this.col = nc;
    this.dens = nd;
    for (let i = this.n; i < want; i++) this.spawn(i);
    this.n = want;
  }

  private seedIntoSilhouette(_mode: "form" | "nerve", fraction: number) {
    const start = Math.max(0, Math.floor(this.n * (1 - fraction)));
    for (let i = start; i < this.n; i++) this.spawn(i, undefined, i);
  }

  private spawn(i: number, at?: { x: number; y: number }, slot?: number) {
    const mode = this.params.mode;
    let px = at?.x;
    let py = at?.y;
    if (px === undefined) {
      if ((mode === "form" || mode === "nerve") && Math.random() < 0.78) {
        const p = this.silhouette.randomPointInActive(mode, slot ?? i);
        if (p) {
          px = p.x;
          py = p.y;
        }
      }
      if (mode === "ember") {
        px = Math.random() * this.w;
        py = this.h + Math.random() * 24;
      }
    }
    this.x[i] = px ?? Math.random() * this.w;
    this.y[i] = py ?? Math.random() * this.h;
    this.vx[i] = (Math.random() - 0.5) * 0.28;
    this.vy[i] = (Math.random() - 0.5) * 0.28;
    this.maxL[i] = 0.8 + Math.random() * 1.7;
    this.life[i] = this.maxL[i] * (0.4 + Math.random() * 0.6);
    this.size[i] = 0.32 + Math.random() * 0.9;
    this.ang[i] = Math.random() * Math.PI * 2;
    this.len[i] = mode === "form" ? 2.2 + Math.random() * 3.2 : mode === "nerve" ? 0.9 + Math.random() * 1.4 : 2.2 + Math.random() * 4.5;
    this.col[i] = Math.floor(Math.random() * PALETTES[this.params.palette].colors.length);
    this.dens[i] = 0;
  }

  private noise(x: number, y: number, t: number) {
    return (
      Math.sin(x * 0.011 + t * 0.31) * Math.cos(y * 0.01 - t * 0.23) +
      Math.sin((x + y) * 0.0075 + t * 0.14) * 0.5
    );
  }

  private wind(x: number, y: number, mode: WindMode, t: number, flow: number) {
    let fx = 0;
    let fy = 0;
    switch (mode) {
      case "drift": {
        const a = this.noise(x, y, t) * Math.PI * 2;
        fx = Math.cos(a) * 0.32 * flow;
        fy = Math.sin(a) * 0.22 * flow + 0.04 * flow;
        break;
      }
      case "orbit": {
        const dx = x - this.w * 0.5;
        const dy = y - this.h * 0.5;
        const d = Math.hypot(dx, dy) + 1;
        fx = (-dy / d) * 0.52 * flow - (dx / d) * 0.07 * flow;
        fy = (dx / d) * 0.52 * flow - (dy / d) * 0.07 * flow;
        const a2 = this.noise(x * 2, y * 2, t * 1.4) * Math.PI;
        fx += Math.cos(a2) * 0.14 * flow;
        fy += Math.sin(a2) * 0.14 * flow;
        break;
      }
      case "weave": {
        fx = this.noise(x, y, t) * 0.48 * flow + Math.sin(y * 0.018 + t * 0.42) * 0.26 * flow;
        fy = this.noise(x + 90, y + 70, t * 0.8) * 0.48 * flow + Math.cos(x * 0.016 - t * 0.36) * 0.26 * flow;
        break;
      }
      case "ember": {
        fx = this.noise(x, y, t * 2) * 0.32 * flow;
        fy = -0.5 * flow + this.noise(x + 40, y, t) * 0.18 * flow;
        break;
      }
      case "tide": {
        const wave = Math.sin(x * 0.0038 + t * 0.55) * Math.cos(y * 0.0028 - t * 0.38);
        fx = wave * 0.62 * flow + Math.sin(t * 0.28) * 0.18 * flow;
        fy = Math.sin(x * 0.0028 - t * 0.48) * 0.32 * flow;
        break;
      }
      default: {
        const a = this.noise(x * 0.7, y * 0.7, t * 0.45) * Math.PI * 2;
        fx = Math.cos(a) * 0.06 * flow;
        fy = Math.sin(a) * 0.05 * flow;
      }
    }
    return { fx, fy };
  }

  update(dt: number) {
    if (this.params.paused || !this.seeded) return;
    this.time += dt;
    const fade = Math.max(0.35, this.params.relayFade);
    if (this.mix < 1) this.mix = Math.min(1, this.mix + dt / fade);
    const mode = this.params.mode;
    const t = this.time;
    const flow = this.params.flow;
    const shaped = mode === "form" || mode === "nerve";
    if (shaped) {
      this.silhouette.update(dt, mode);
      if (this.silhouette.generation !== this.lastGen) {
        this.lastGen = this.silhouette.generation;
        this.rebuild();
        this.seedIntoSilhouette(mode, mode === "form" && this.silhouette.seedFrom > 0 ? 0.36 : 1);
      }
    }

    const ptr = this.pointer;
    ptr.force = ptr.down ? Math.min(1, ptr.force + dt * 2.2) : Math.max(0, ptr.force - dt * 1.6);
    const pdx = ptr.x - ptr.px;
    const pdy = ptr.y - ptr.py;

    const n = this.n;
    const w = this.w;
    const h = this.h;
    const damp = mode === "ember" ? 0.968 : shaped ? 0.99 : 0.984;
    const maxSpd = mode === "ember" ? 4.2 : shaped ? 2.1 : 2.6;

    for (let i = 0; i < n; i++) {
      let x = this.x[i]!;
      let y = this.y[i]!;
      let vx = this.vx[i]!;
      let vy = this.vy[i]!;

      const wind = this.wind(x, y, mode, t, flow);
      vx += wind.fx * dt * 60;
      vy += wind.fy * dt * 60;

      let d = 0;
      if (shaped) {
        const s = this.silhouette.sample(x, y);
        d = s.dens;
        this.dens[i] = d;
        if (d > 0.012) {
          vx += s.fx * 26 * dt;
          vy += s.fy * 26 * dt;
          vx += s.tx * 28 * dt;
          vy += s.ty * 28 * dt;
          if (mode === "form") vy -= 6.5 * dt * Math.min(1, d);
          const settle = Math.max(0.12, 1 - Math.min(1, d) * 0.8);
          vx *= settle;
          vy *= settle;
          this.life[i] = Math.min(this.maxL[i]!, this.life[i]! + d * dt * 1.6);
          this.len[i] = mode === "form" ? 1.8 + (1 - Math.min(1, d)) * 5.2 : 0.85 + (1 - Math.min(1, d)) * 3.4;
          this.size[i] = 0.42 + Math.min(1, d) * 0.75;
          if (d > 0.22 && Math.random() < 0.12) this.col[i] = 3;
        } else {
          vx += (this.silhouette.cx - x) * 0.12 * dt;
          vy += (this.silhouette.cy - y) * 0.1 * dt;
        }
      } else {
        this.dens[i] = 0;
      }

      if (ptr.force > 0.01) {
        const dx = x - ptr.x;
        const dy = y - ptr.y;
        const d2 = dx * dx + dy * dy;
        const radius = 110 + ptr.force * 90;
        if (d2 < radius * radius) {
          const dist = Math.sqrt(d2) + 0.02;
          const str = (1 - dist / radius) * ptr.force * 2.1;
          vx += (dx / dist) * str * 42 * dt + pdx * str * 0.75;
          vy += (dy / dist) * str * 42 * dt + pdy * str * 0.75;
        }
      }

      vx *= damp;
      vy *= damp;
      const spd = Math.hypot(vx, vy);
      if (spd > maxSpd) {
        const s = maxSpd / spd;
        vx *= s;
        vy *= s;
      }

      x += vx;
      y += vy;
      if (spd > 0.12 && !shaped) {
        this.ang[i] = Math.atan2(vy, vx);
        this.len[i] = 2.2 + Math.min(5.8, spd * 2.1);
      } else if (spd > 0.1) {
        this.ang[i] = Math.atan2(vy, vx);
      }

      const decay = mode === "ember" ? 0.38 : shaped ? (d > 0.04 ? 0.05 : 0.22) : 0.11;
      let life = this.life[i]! - dt * decay;
      if (life <= 0 || x < -24 || x > w + 24 || y < -24 || y > h + 24) {
        this.spawn(i);
      } else {
        this.x[i] = x;
        this.y[i] = y;
        this.vx[i] = vx;
        this.vy[i] = vy;
        this.life[i] = life;
      }
    }

    ptr.px = ptr.x;
    ptr.py = ptr.y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const pal = this.displayPalette();
    const fade = Math.max(0.03, Math.min(0.24, this.params.trail));
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${pal.bg[0]},${pal.bg[1]},${pal.bg[2]},${fade})`;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    const n = this.n;
    const colors = pal.colors;
    const thickMul = this.params.thickness;
    const shaped = this.params.mode === "form" || this.params.mode === "nerve";

    for (let i = 0; i < n; i++) {
      const a = this.life[i]! / this.maxL[i]!;
      if (a < 0.03) continue;
      const c = colors[this.col[i]! % colors.length]!;
      const half = this.len[i]! * 0.5;
      const cos = Math.cos(this.ang[i]!);
      const sin = Math.sin(this.ang[i]!);
      const px = this.x[i]!;
      const py = this.y[i]!;
      const d = this.dens[i]!;
      const alpha = a * (shaped ? (this.params.mode === "form" ? 0.74 : 0.58) + Math.min(1, d) * 0.42 : 0.72);
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
      ctx.lineWidth = Math.max(0.1, this.size[i]! * thickMul);
      ctx.beginPath();
      ctx.moveTo(px - cos * half, py - sin * half);
      ctx.lineTo(px + cos * half, py + sin * half);
      ctx.stroke();
      if (shaped && d > 0.2) {
        const r = Math.max(0.35, this.size[i]! * thickMul * 0.85);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a * d * 0.45})`;
        ctx.fillRect(px - r * 0.5, py - r * 0.5, r, r);
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  fillVoid(ctx: CanvasRenderingContext2D) {
    const pal = this.displayPalette();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgb(${pal.bg[0]},${pal.bg[1]},${pal.bg[2]})`;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  clear() {
    for (let i = 0; i < this.n; i++) this.spawn(i);
  }

  displayPalette() {
    const to = PALETTES[this.params.palette];
    const t = smooth(this.mix);
    if (t >= 0.995) return to;
    return {
      bg: lerpRgb(this.fromBg, to.bg, t),
      colors: to.colors.map((c, i) => lerpRgb(this.fromColors[i] ?? c, c, t)),
    };
  }

  energy() {
    return this.pointer.force;
  }
}
