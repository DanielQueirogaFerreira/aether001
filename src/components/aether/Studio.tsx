import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ParticleEngine } from "@/lib/aether/engine";
import { loadFrames, removeFrame, saveFrame, type FrameThumb } from "@/lib/aether/frames";
import { operator, type OperatorCommand } from "@/lib/aether/operator";
import { sound } from "@/lib/aether/sound";
import { createWakeGuard } from "@/lib/aether/wake";
import { PALETTES, PALETTE_IDS, WIND_MODES, DEFAULT_FORM_DELAYS, type FormDelayKey, type FormDelays, type PaletteId, type RelayMode, type SoundSource, type WindMode } from "@/lib/aether/types";
import { FieldPanel } from "./FieldPanel";
import { Gallery } from "./Gallery";
import { OperatorGate } from "./OperatorGate";
import { VersionBadge } from "./VersionBadge";

function exportPng(canvas: HTMLCanvasElement, palette: PaletteId) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (!octx) return null;
  const bg = PALETTES[palette].bg;
  octx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
  octx.fillRect(0, 0, w, h);
  octx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
  return off.toDataURL("image/png");
}

function shuffleIds(except?: PaletteId) {
  const a = PALETTE_IDS.filter((id) => id !== except);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

export function Studio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const enteredRef = useRef(false);
  const wakeRef = useRef<ReturnType<typeof createWakeGuard> | null>(null);

  const [entered, setEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<WindMode>("drift");
  const [palette, setPalette] = useState<PaletteId>("solar");
  const [density, setDensity] = useState(1);
  const [thickness, setThickness] = useState(0.45);
  const [flow, setFlow] = useState(0.55);
  const [trail, setTrail] = useState(0.09);
  const [formCount, setFormCount] = useState(1);
  const [formRemain, setFormRemain] = useState(0);
  const [formDelays, setFormDelays] = useState<FormDelays>({ ...DEFAULT_FORM_DELAYS });
  const [panelOpen, setPanelOpen] = useState(true);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [frames, setFrames] = useState<FrameThumb[]>([]);
  const [toast, setToast] = useState("");
  const [soundSource, setSoundSource] = useState<SoundSource>("aether");
  const [volume, setVolume] = useState(0.42);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasOperator, setHasOperator] = useState(false);
  const [opSession, setOpSession] = useState(false);
  const [gateExit, setGateExit] = useState(true);
  const [opGate, setOpGate] = useState<{ mode: "setup" | "verify" | "change"; command: OperatorCommand } | null>(null);
  const allowExitRef = useRef(false);
  const skipSetupRef = useRef(false);
  const [relayMode, setRelayMode] = useState<RelayMode>("off");
  const [relayLoop, setRelayLoop] = useState(true);
  const [relayHold, setRelayHold] = useState(6);
  const [relayHolds, setRelayHolds] = useState<number[]>(() => PALETTE_IDS.map(() => 6));
  const [relaySeq, setRelaySeq] = useState<PaletteId[]>(() => [...PALETTE_IDS]);
  const [relayStep, setRelayStep] = useState(0);
  const [relayRemain, setRelayRemain] = useState(0);
  const [relayFocus, setRelayFocus] = useState(0);
  const relayRef = useRef({
    mode: "off" as RelayMode,
    loop: true,
    hold: 6,
    holds: PALETTE_IDS.map(() => 6),
    seq: [...PALETTE_IDS] as PaletteId[],
    step: 0,
    remain: 0,
    bag: [] as PaletteId[],
    palette: "solar" as PaletteId,
    paused: false,
  });

  useEffect(() => {
    enteredRef.current = entered;
  }, [entered]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (mq.matches) setPanelOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new ParticleEngine();
    engineRef.current = engine;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        engine.w = w;
        engine.h = h;
        engine.fillVoid(ctx);
      }
      engine.resize(w, h);
    };
    resize();
    window.addEventListener("resize", resize);
    setFrames(loadFrames());
    setHasOperator(operator.hasKey());
    setGateExit(operator.gateExit());
    wakeRef.current = createWakeGuard();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      wakeRef.current?.destroy();
      wakeRef.current = null;
      sound.destroy();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setParams({
      mode,
      palette,
      density,
      thickness,
      flow,
      trail,
      paused,
      formDelays,
      relayFade: Math.min(2.4, Math.max(0.55, (relayMode === "sequence" ? relayHolds[relayStep] ?? relayHold : relayHold) * 0.32)),
    });
    sound.setMode(mode);
  }, [mode, palette, density, thickness, flow, trail, paused, formDelays, relayHold, relayHolds, relayMode, relayStep]);

  useEffect(() => {
    const api = {
      setMode,
      setPalette,
      setDensity,
      setThickness,
      setFormDelays: (d: FormDelays) => setFormDelays({ ...DEFAULT_FORM_DELAYS, ...d }),
      setFormCount: (n: number) => {
        engineRef.current?.silhouette.setFormCount(n);
        setFormCount(n);
      },
      formCount: () => engineRef.current?.silhouette.formCount ?? 1,
    };
    (window as unknown as { __aether: typeof api }).__aether = api;
  }, []);

  useEffect(() => {
    if (mode !== "form") {
      setFormCount(1);
      setFormRemain(0);
      return;
    }
    const id = window.setInterval(() => {
      const s = engineRef.current?.silhouette;
      setFormCount(s?.formCount ?? 1);
      setFormRemain(s?.formRemain ?? 0);
    }, 200);
    return () => window.clearInterval(id);
  }, [mode]);

  useEffect(() => {
    Object.assign(relayRef.current, {
      mode: relayMode,
      loop: relayLoop,
      hold: relayHold,
      holds: relayHolds,
      seq: relaySeq,
      palette,
      paused,
    });
  });

  useEffect(() => {
    if (!entered || paused || relayMode === "off") return;
    const id = window.setInterval(() => {
      const r = relayRef.current;
      if (r.mode === "off" || r.paused) return;
      r.remain -= 0.1;
      if (r.remain > 0.05) {
        setRelayRemain(r.remain);
        return;
      }
      if (r.mode === "sequence") {
        const next = r.step + 1;
        if (next >= r.seq.length) {
          if (!r.loop) {
            r.mode = "off";
            setRelayMode("off");
            setRelayRemain(0);
            return;
          }
          r.step = 0;
        } else {
          r.step = next;
        }
        setRelayStep(r.step);
        setRelayFocus(r.step);
        const nextPal = r.seq[r.step]!;
        r.palette = nextPal;
        setPalette(nextPal);
        r.remain = r.holds[r.step] ?? r.hold;
        setRelayRemain(r.remain);
      } else {
        if (r.bag.length === 0) {
          if (!r.loop) {
            r.mode = "off";
            setRelayMode("off");
            setRelayRemain(0);
            return;
          }
          r.bag = shuffleIds(r.palette);
        }
        const nextPal = r.bag.shift()!;
        r.palette = nextPal;
        setPalette(nextPal);
        r.remain = r.hold * (0.78 + Math.random() * 0.44);
        setRelayRemain(r.remain);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [entered, paused, relayMode]);

  useEffect(() => {
    if (!entered) return;
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      engine.update(dt);
      engine.draw(ctx);
      sound.setEnergy(engine.energy());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [entered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const onDown = (e: PointerEvent) => {
      if (!enteredRef.current) return;
      engine.pointer.x = e.clientX;
      engine.pointer.y = e.clientY;
      engine.pointer.px = e.clientX;
      engine.pointer.py = e.clientY;
      engine.pointer.down = true;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      engine.pointer.x = e.clientX;
      engine.pointer.y = e.clientY;
    };
    const onUp = () => {
      engine.pointer.down = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1700);
  }, []);

  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = exportPng(canvas, palette);
    if (!dataUrl) return;
    setFrames(saveFrame(dataUrl));
    showToast("Frame saved");
  }, [palette, showToast]);

  const downloadCurrent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = exportPng(canvas, palette);
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `aether-${Date.now()}.png`;
    a.click();
    showToast("Downloaded");
  }, [palette, showToast]);

  const toggleMute = useCallback(() => {
    sound.toggleMute();
    setMuted(sound.state.muted);
  }, []);

  const runCommand = useCallback((cmd: OperatorCommand) => {
    if (cmd === "exit-fullscreen") {
      allowExitRef.current = true;
      if (document.fullscreenElement) void document.exitFullscreen();
      return;
    }
    if (cmd === "hide") {
      operator.openSession();
      setOpSession(true);
      setChromeHidden(true);
      return;
    }
    if (cmd === "show") {
      operator.openSession();
      setOpSession(true);
      setChromeHidden(false);
      return;
    }
    if (cmd === "leave") {
      allowExitRef.current = true;
      operator.openSession();
      setOpSession(true);
      setChromeHidden(false);
      setEntered(false);
      if (document.fullscreenElement) void document.exitFullscreen();
      return;
    }
    if (cmd === "unlock-exit") {
      operator.setGateExit(false);
      setGateExit(false);
      operator.openSession();
      setOpSession(true);
    }
  }, []);

  const requestCommand = useCallback(
    (cmd: OperatorCommand) => {
      if (cmd === "setup") {
        setOpGate({ mode: "setup", command: "setup" });
        return;
      }
      if (cmd === "change") {
        setOpGate({ mode: "change", command: "change" });
        return;
      }
      const locked = operator.hasKey();
      const inFs = Boolean(document.fullscreenElement);
      const needs =
        locked &&
        ((cmd === "exit-fullscreen" && inFs && operator.gateExit()) ||
          cmd === "hide" ||
          cmd === "show" ||
          cmd === "leave" ||
          cmd === "unlock-exit");
      const sessionOk = operator.isSessionOpen() && cmd !== "exit-fullscreen";
      if (needs && !sessionOk) {
        setOpGate({ mode: "verify", command: cmd });
        return;
      }
      runCommand(cmd);
    },
    [runCommand],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      requestCommand("exit-fullscreen");
      return;
    }
    void document.documentElement.requestFullscreen().catch(() => {
      showToast("Fullscreen unavailable");
    });
  }, [requestCommand, showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!enteredRef.current) return;
      if (e.key === "F11") return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const k = e.key.toLowerCase();
      if (k === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (k === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        captureFrame();
      } else if (k === "g") {
        e.preventDefault();
        setGalleryOpen((o) => !o);
      } else if (k === "h") {
        e.preventDefault();
        requestCommand(chromeHidden ? "show" : "hide");
      } else if (k === "f") {
        setPanelOpen((o) => !o);
      } else if (k === "m") {
        toggleMute();
      } else if (k >= "1" && k <= "7") {
        const idx = Number(k) - 1;
        const next = WIND_MODES[idx];
        if (next) setMode(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [captureFrame, toggleMute, requestCommand, chromeHidden]);

  useEffect(() => {
    const onVis = () => sound.onVisibility();
    const onFs = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (enteredRef.current && !paused) wakeRef.current?.setActive(true);
      if (fs) {
        allowExitRef.current = false;
        if (!operator.hasKey() && !skipSetupRef.current) setOpGate({ mode: "setup", command: "setup" });
      } else if (operator.hasKey() && operator.gateExit() && !allowExitRef.current) {
        void document.documentElement.requestFullscreen().catch(() => {});
        setOpGate({ mode: "verify", command: "exit-fullscreen" });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [paused]);

  useEffect(() => {
    wakeRef.current?.setActive(entered && !paused);
  }, [entered, paused]);

  const handleEnter = async () => {
    sound.unlock();
    setEntered(true);
    wakeRef.current?.setActive(true);
    await sound.enter();
  };

  const chromeVisible = entered && !chromeHidden && !galleryOpen;
  const iconBtn =
    "flex size-11 items-center justify-center rounded-md text-peach/50 transition-colors hover:bg-solar/12 hover:text-peach";

  return (
    <div className="fixed inset-0 bg-void">
      <canvas ref={canvasRef} className="studio-canvas" />

      <div
        className={`gate-scrim fixed inset-0 z-40 flex flex-col items-center justify-center bg-void transition-[opacity,visibility] duration-700 ${
          entered ? "pointer-events-none invisible opacity-0" : "opacity-100"
        }`}
      >
        <h1 className="font-display text-6xl font-light tracking-wide text-peach sm:text-7xl">Aether</h1>
        <p className="mt-3 mb-10 text-xs font-medium tracking-[0.32em] text-peach/50 uppercase">Paint with light</p>
        <button
          type="button"
          className="min-h-11 rounded-full border border-solar/40 bg-solar/10 px-8 py-2.5 text-sm tracking-[0.14em] text-peach uppercase transition-colors hover:border-solar hover:bg-solar/20"
          onClick={() => void handleEnter()}
        >
          Enter field
        </button>
      </div>

      <header
        className={`chrome-fade pointer-events-auto fixed top-0 right-0 left-0 z-30 flex h-12 items-center gap-0.5 bg-gradient-to-b from-void/85 to-transparent px-2 ${
          chromeVisible ? "" : "pointer-events-none hidden -translate-y-full opacity-0"
        }`}
      >
        <span className="font-display mr-auto pl-2 text-lg font-light tracking-wide text-peach">Aether</span>
        <button type="button" className={iconBtn} title={paused ? "Play (Space)" : "Pause (Space)"} onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}>
          {paused ? <Play className="size-[18px]" strokeWidth={1.6} /> : <Pause className="size-[18px]" strokeWidth={1.6} />}
        </button>
        <button type="button" className={iconBtn} title="Mute (M)" onClick={toggleMute} aria-label="Toggle sound">
          {muted ? <VolumeX className="size-[18px]" strokeWidth={1.6} /> : <Volume2 className="size-[18px]" strokeWidth={1.6} />}
        </button>
        <button type="button" className={iconBtn} title="Capture frame (S)" onClick={captureFrame} aria-label="Capture">
          <Camera className="size-[18px]" strokeWidth={1.6} />
        </button>
        <button type="button" className={iconBtn} title="Download PNG" onClick={downloadCurrent} aria-label="Download">
          <Download className="size-[18px]" strokeWidth={1.6} />
        </button>
        <button type="button" className={iconBtn} title="Gallery (G)" onClick={() => setGalleryOpen(true)} aria-label="Gallery">
          <LayoutGrid className="size-[18px]" strokeWidth={1.6} />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${panelOpen ? "bg-solar/12 text-peach" : ""}`}
          title="Field panel (F)"
          onClick={() => setPanelOpen((o) => !o)}
          aria-label="Field panel"
        >
          <SlidersHorizontal className="size-[18px]" strokeWidth={1.6} />
        </button>
        <button
          type="button"
          className={`${iconBtn} ${isFullscreen ? "bg-solar/12 text-peach" : ""}`}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="size-[18px]" strokeWidth={1.6} /> : <Maximize2 className="size-[18px]" strokeWidth={1.6} />}
        </button>
        <button type="button" className={iconBtn} title="Hide controls (H)" onClick={() => requestCommand("hide")} aria-label="Hide controls">
          <EyeOff className="size-[18px]" strokeWidth={1.6} />
        </button>
      </header>

      <FieldPanel
        open={chromeVisible && panelOpen}
        mobile={isMobile}
        mode={mode}
        palette={palette}
        density={density}
        thickness={thickness}
        flow={flow}
        trail={trail}
        formCount={formCount}
        formRemain={formRemain}
        formDelays={formDelays}
        soundSource={soundSource}
        volume={volume}
        loop={loop}
        onClose={() => setPanelOpen(false)}
        onMode={setMode}
        onPalette={(p) => {
          setPalette(p);
          const r = relayRef.current;
          r.remain = r.mode === "sequence" ? (r.holds[r.step] ?? r.hold) : r.hold;
          setRelayRemain(r.remain);
        }}
        relayMode={relayMode}
        relayLoop={relayLoop}
        relayHold={relayHold}
        relayHolds={relayHolds}
        relaySeq={relaySeq}
        relayStep={relayStep}
        relayRemain={relayRemain}
        relayFocus={relayFocus}
        onRelayMode={(m) => {
          setRelayMode(m);
          const r = relayRef.current;
          r.mode = m;
          if (m === "sequence") {
            r.step = 0;
            setRelayStep(0);
            setRelayFocus(0);
            const first = relaySeq[0]!;
            r.palette = first;
            setPalette(first);
            r.remain = relayHolds[0] ?? relayHold;
            setRelayRemain(r.remain);
            r.bag = [];
          } else if (m === "random") {
            r.bag = shuffleIds(palette);
            r.remain = relayHold;
            setRelayRemain(relayHold);
          } else {
            setRelayRemain(0);
          }
        }}
        onRelayLoop={setRelayLoop}
        onRelayHold={(v) => {
          if (relayMode === "sequence") {
            setRelayHolds((h) => {
              const n = [...h];
              n[relayFocus] = v;
              return n;
            });
          } else {
            setRelayHold(v);
          }
        }}
        onRelaySeq={(i, p) => {
          setRelaySeq((s) => {
            const n = [...s];
            n[i] = p;
            return n;
          });
          if (i === relayStep) setPalette(p);
        }}
        onRelayFocus={setRelayFocus}
        onDensity={setDensity}
        onThickness={setThickness}
        onFlow={setFlow}
        onTrail={setTrail}
        onFormDelay={(key: FormDelayKey, v: number) => setFormDelays((d) => ({ ...d, [key]: v }))}
        onFormDelaysReset={() => setFormDelays({ ...DEFAULT_FORM_DELAYS })}
        onSoundSource={(s) => {
          sound.setSource(s);
          setSoundSource(s);
        }}
        onVolume={(v) => {
          sound.setVolume(v);
          setVolume(v);
        }}
        onLoop={(v) => {
          sound.setLoop(v);
          setLoop(v);
        }}
        onFile={(f) => {
          sound.setFile(f);
          setSoundSource("file");
        }}
        onClear={() => {
          engineRef.current?.clear();
          showToast("Field cleared");
        }}
        hasOperator={hasOperator}
        opSession={opSession}
        gateExit={gateExit && hasOperator}
        onSetOperator={() => requestCommand("setup")}
        onChangeOperator={() => requestCommand("change")}
        onLeaveField={() => requestCommand("leave")}
        onGateExit={(on) => {
          if (on) {
            if (!operator.hasKey()) {
              requestCommand("setup");
              return;
            }
            operator.setGateExit(true);
            setGateExit(true);
            return;
          }
          requestCommand("unlock-exit");
        }}
      />

      <div
        className={`chrome-fade fixed right-0 bottom-0 left-0 z-20 flex gap-1.5 overflow-x-auto bg-gradient-to-t from-void/90 to-transparent px-3 pr-16 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-6 ${
          chromeVisible ? "" : "pointer-events-none hidden translate-y-full opacity-0"
        }`}
      >
        {WIND_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`min-h-10 shrink-0 rounded-full border px-3.5 text-xs tracking-wide ${
              mode === m.id
                ? "border-solar/50 bg-solar/20 text-peach"
                : "border-transparent bg-solar/8 text-peach/55"
            }`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`fixed top-2.5 right-2.5 z-40 flex size-11 items-center justify-center rounded-md bg-void/60 text-peach/50 transition-opacity ${
          entered && chromeHidden && !galleryOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => requestCommand("show")}
        aria-label="Show controls"
      >
        <Eye className="size-[18px]" strokeWidth={1.6} />
      </button>

      <Gallery
        open={galleryOpen}
        frames={frames}
        onClose={() => setGalleryOpen(false)}
        onDownload={(f) => {
          const a = document.createElement("a");
          a.href = f.dataUrl;
          a.download = `aether-${f.ts}.png`;
          a.click();
        }}
        onRemove={(id) => setFrames(removeFrame(id))}
      />

      <div
        className={`pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-solar/35 bg-solar/20 px-4 py-1.5 text-xs text-peach transition-opacity ${
          toast ? "opacity-100" : "opacity-0"
        }`}
      >
        {toast}
      </div>

      <OperatorGate
        open={Boolean(opGate)}
        mode={opGate?.mode ?? "verify"}
        command={opGate?.command ?? "exit-fullscreen"}
        onCancel={() => {
          if (opGate?.mode === "setup") skipSetupRef.current = true;
          if (opGate?.command === "exit-fullscreen" && !document.fullscreenElement) {
            void document.documentElement.requestFullscreen().catch(() => {});
          }
          setOpGate(null);
        }}
        onSet={() => {
          setHasOperator(true);
          setOpSession(true);
          setGateExit(operator.gateExit());
          setOpGate(null);
          showToast("Operator key set");
        }}
        onVerified={(cmd) => {
          setOpSession(true);
          setOpGate(null);
          runCommand(cmd);
        }}
      />

      <VersionBadge visible={!entered || chromeVisible} />
    </div>
  );
}
