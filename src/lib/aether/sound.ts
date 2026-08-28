import type { SoundSource, WindMode } from "./types";

export interface SoundState {
  source: SoundSource;
  volume: number;
  muted: boolean;
  loop: boolean;
  playing: boolean;
}

type Listener = () => void;

export class SoundManager {
  private audio: HTMLAudioElement | null = null;
  private fileUrl: string | null = null;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private air: GainNode | null = null;
  private osc: { o: OscillatorNode; g: GainNode; f: BiquadFilterNode }[] = [];
  private fieldTimer = 0;
  private mode: WindMode = "drift";
  state: SoundState = {
    source: "aether",
    volume: 0.42,
    muted: false,
    loop: true,
    playing: false,
  };
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  unlock() {
    this.ensureCtx();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private ensureCtx() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.air = this.ctx.createGain();
      this.air.gain.value = 0;
      this.master.gain.value = this.effective();
      this.air.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
  }

  private effective() {
    return this.state.muted ? 0 : this.state.volume * this.state.volume;
  }

  async enter() {
    this.unlock();
    if (this.state.source === "aether") await this.playAether();
    else if (this.state.source === "field") this.startField();
    else if (this.state.source === "file" && this.fileUrl) await this.playUrl(this.fileUrl);
  }

  setSource(src: SoundSource) {
    this.stopAll();
    this.state.source = src;
    if (src === "aether") void this.playAether();
    else if (src === "field") this.startField();
    else if (src === "file" && this.fileUrl) void this.playUrl(this.fileUrl);
    this.emit();
  }

  setVolume(v: number) {
    this.state.volume = Math.max(0, Math.min(1, v));
    this.applyGain();
    this.emit();
  }

  setMuted(m: boolean) {
    this.state.muted = m;
    this.applyGain();
    this.emit();
  }

  toggleMute() {
    this.setMuted(!this.state.muted);
  }

  setLoop(loop: boolean) {
    this.state.loop = loop;
    if (this.audio) this.audio.loop = loop;
    this.emit();
  }

  setFile(file: File) {
    if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
    this.fileUrl = URL.createObjectURL(file);
    this.setSource("file");
  }

  setMode(mode: WindMode) {
    this.mode = mode;
    if (this.state.source === "field" && this.ctx) {
      const freqs = this.freqs();
      this.osc.forEach((n, i) => {
        const f = freqs[i % freqs.length]!;
        n.o.frequency.setTargetAtTime(f, this.ctx!.currentTime, 0.4);
      });
    }
  }

  setEnergy(e: number) {
    if (!this.air || !this.ctx) return;
    // Gentle air opening on stir — never crush the track.
    const open = e * 0.12;
    this.air.gain.setTargetAtTime(open, this.ctx.currentTime, 0.12);
  }

  onVisibility() {
    if (document.hidden) return;
    if (this.ctx?.state === "suspended") void this.ctx.resume();
    if (this.audio && this.state.playing && this.audio.paused) void this.audio.play().catch(() => {});
  }

  private applyGain() {
    const g = this.effective();
    if (this.audio) this.audio.volume = g;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05);
  }

  private ensureAudio() {
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "auto";
      this.audio.addEventListener("ended", () => {
        if (!this.state.loop) {
          this.state.playing = false;
          this.emit();
        }
      });
    }
    return this.audio;
  }

  private async playAether() {
    await this.playUrl("/ethereal.mp3");
  }

  private async playUrl(url: string) {
    this.stopField();
    const a = this.ensureAudio();
    a.src = url;
    a.loop = this.state.loop;
    a.volume = this.effective();
    try {
      await a.play();
      this.state.playing = true;
    } catch {
      this.state.playing = false;
    }
    this.emit();
  }

  private freqs() {
    switch (this.mode) {
      case "orbit":
        return [55, 82.5, 110, 165];
      case "ember":
        return [70, 105, 140];
      case "tide":
        return [40, 60, 80, 120];
      case "form":
        return [65, 98, 130, 196];
      case "nerve":
        return [50, 75, 100, 150];
      case "weave":
        return [60, 90, 135, 180];
      default:
        return [48, 72, 96, 144];
    }
  }

  private startField() {
    this.unlock();
    if (!this.ctx || !this.master) return;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.stopField();
    for (const f of this.freqs()) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const fl = this.ctx.createBiquadFilter();
      o.type = "sine";
      o.frequency.value = f;
      fl.type = "lowpass";
      fl.frequency.value = 520 + Math.random() * 380;
      g.gain.value = 0.07 + Math.random() * 0.05;
      o.connect(fl);
      fl.connect(g);
      g.connect(this.master);
      o.start();
      this.osc.push({ o, g, f: fl });
    }
    this.fieldTimer = window.setInterval(() => {
      if (!this.ctx) return;
      for (const n of this.osc) {
        n.o.frequency.setTargetAtTime(
          n.o.frequency.value * (0.985 + Math.random() * 0.03),
          this.ctx.currentTime,
          0.6,
        );
      }
    }, 1400);
    this.state.playing = true;
    this.emit();
  }

  private stopField() {
    for (const n of this.osc) {
      try {
        n.o.stop();
        n.o.disconnect();
        n.g.disconnect();
        n.f.disconnect();
      } catch {
        /* already stopped */
      }
    }
    this.osc = [];
    if (this.fieldTimer) {
      clearInterval(this.fieldTimer);
      this.fieldTimer = 0;
    }
  }

  private stopAll() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.stopField();
    this.state.playing = false;
  }

  destroy() {
    this.stopAll();
    if (this.fileUrl) URL.revokeObjectURL(this.fileUrl);
    void this.ctx?.close();
    this.ctx = null;
  }
}

export const sound = new SoundManager();
