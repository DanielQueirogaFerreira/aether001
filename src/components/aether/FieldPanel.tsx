import {
  FORM_DELAY_META,
  PALETTES,
  PALETTE_IDS,
  WIND_MODES,
  type FormDelayKey,
  type FormDelays,
  type PaletteId,
  type RelayMode,
  type SoundSource,
  type WindMode,
} from "@/lib/aether/types";

interface Props {
  open: boolean;
  mobile: boolean;
  mode: WindMode;
  palette: PaletteId;
  density: number;
  thickness: number;
  flow: number;
  trail: number;
  formCount: number;
  formRemain: number;
  formDelays: FormDelays;
  soundSource: SoundSource;
  volume: number;
  loop: boolean;
  onClose: () => void;
  onMode: (m: WindMode) => void;
  onPalette: (p: PaletteId) => void;
  relayMode: RelayMode;
  relayLoop: boolean;
  relayHold: number;
  relayHolds: number[];
  relaySeq: PaletteId[];
  relayStep: number;
  relayRemain: number;
  relayFocus: number;
  onRelayMode: (m: RelayMode) => void;
  onRelayLoop: (v: boolean) => void;
  onRelayHold: (v: number) => void;
  onRelaySeq: (i: number, p: PaletteId) => void;
  onRelayFocus: (i: number) => void;
  onDensity: (v: number) => void;
  onThickness: (v: number) => void;
  onFlow: (v: number) => void;
  onTrail: (v: number) => void;
  onFormDelay: (key: FormDelayKey, v: number) => void;
  onFormDelaysReset: () => void;
  onSoundSource: (s: SoundSource) => void;
  onVolume: (v: number) => void;
  onLoop: (v: boolean) => void;
  onFile: (f: File) => void;
  onClear: () => void;
  hasOperator: boolean;
  opSession: boolean;
  gateExit: boolean;
  onSetOperator: () => void;
  onChangeOperator: () => void;
  onLeaveField: () => void;
  onGateExit: (on: boolean) => void;
}

const palettes = Object.values(PALETTES);

function SliderRow({
  label,
  value,
  display,
  hint,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs text-peach/55">{label}</span>
        <span className="font-mono text-xs tabular-nums text-peach/80">{display}</span>
      </span>
      <input
        className="aether-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      {hint ? <span className="mt-1 block text-xs text-peach/35">{hint}</span> : null}
    </label>
  );
}

function thicknessLabel(v: number) {
  if (v < 0.4) return "hair";
  if (v < 0.8) return "fine";
  if (v < 1.4) return "full";
  return "heavy";
}

export function FieldPanel(props: Props) {
  const {
    open,
    mobile,
    mode,
    palette,
    density,
    thickness,
    flow,
    trail,
    formCount,
    formRemain,
    formDelays,
    soundSource,
    volume,
    loop,
    onClose,
    onMode,
    onPalette,
    relayMode,
    relayLoop,
    relayHold,
    relayHolds,
    relaySeq,
    relayStep,
    relayRemain,
    relayFocus,
    onRelayMode,
    onRelayLoop,
    onRelayHold,
    onRelaySeq,
    onRelayFocus,
    onDensity,
    onThickness,
    onFlow,
    onTrail,
    onFormDelay,
    onFormDelaysReset,
    onSoundSource,
    onVolume,
    onLoop,
    onFile,
    onClear,
    hasOperator,
    opSession,
    gateExit,
    onSetOperator,
    onChangeOperator,
    onLeaveField,
    onGateExit,
  } = props;

  const body = (
    <div className="flex flex-col gap-6">
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-peach/50">Lines</p>
        <SliderRow
          label="Density"
          value={density}
          display={`${Math.round(density * 100)}%`}
          hint="Fewer or more dots and filaments"
          min={0.2}
          max={3}
          step={0.05}
          onChange={onDensity}
        />
        <SliderRow
          label="Thickness"
          value={thickness}
          display={thicknessLabel(thickness)}
          hint="Hairline ↔ thick stroke"
          min={0.12}
          max={2.6}
          step={0.04}
          onChange={onThickness}
        />
        <SliderRow label="Flow" value={flow} display={flow.toFixed(2)} min={0.1} max={1} step={0.05} onChange={onFlow} />
        <SliderRow
          label="Trail"
          value={trail}
          display={trail.toFixed(2)}
          min={0.03}
          max={0.22}
          step={0.01}
          onChange={onTrail}
        />
        <button
          type="button"
          className="min-h-10 w-full rounded-md border border-hair bg-solar/8 text-sm text-peach/60 hover:bg-solar/16 hover:text-peach"
          onClick={onClear}
        >
          Clear
        </button>
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-peach/50">Wind</p>
        <div className="grid grid-cols-2 gap-1.5">
          {WIND_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.hint}
              className={`min-h-10 rounded-md border text-sm ${
                mode === m.id
                  ? "border-solar/45 bg-solar/20 text-peach"
                  : "border-transparent bg-solar/5 text-peach/55 hover:bg-solar/12 hover:text-peach"
              }`}
              onClick={() => onMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === "form" ? (
          <p className="mt-2 text-xs text-peach/45">
            Now {formCount}
            {formRemain > 0 ? ` · next in ${formRemain.toFixed(1)}s` : " · returning"}
          </p>
        ) : null}
        {mode === "nerve" ? (
          <p className="mt-2 text-xs text-peach/45">Brain, cord, plexus — a signal moving through</p>
        ) : null}
      </section>

      {mode === "form" ? (
        <section>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-peach/50">Stagger</p>
          <p className="mb-3 text-xs text-peach/40">1 → 2 → 3 → 5 → 7 · a circle, hands to hands</p>
          {FORM_DELAY_META.map((row) => (
            <SliderRow
              key={row.key}
              label={row.label}
              value={formDelays[row.key]}
              display={`${formDelays[row.key].toFixed(1)}s`}
              hint={row.hint}
              min={1.2}
              max={12}
              step={0.1}
              onChange={(v) => onFormDelay(row.key, v)}
            />
          ))}
          <button
            type="button"
            className="min-h-10 w-full rounded-md border border-hair bg-solar/8 text-sm text-peach/60 hover:bg-solar/16 hover:text-peach"
            onClick={onFormDelaysReset}
          >
            Reset stagger
          </button>
        </section>
      ) : null}

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-peach/50">Palette</p>
        <div className="grid grid-cols-7 gap-1.5">
          {palettes.map((p) => {
            const a = p.colors[0];
            const b = p.colors[p.colors.length - 1];
            return (
              <button
                key={p.id}
                type="button"
                title={`${p.name} · ${p.kind}`}
                aria-label={p.name}
                className={`h-9 flex-1 rounded-md border-2 ${
                  palette === p.id ? "border-peach" : "border-transparent"
                }`}
                style={{
                  background: `linear-gradient(135deg, rgb(${a!.join(",")}), rgb(${b!.join(",")}))`,
                }}
                onClick={() => onPalette(p.id)}
              />
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-peach/45">
          {PALETTES[palette].name}
          {relayMode === "off"
            ? ` · ${PALETTES[palette].kind}`
            : relayMode === "sequence"
              ? ` · ${relayStep + 1}/7 · next ${Math.max(0, relayRemain).toFixed(1)}s`
              : ` · shuffle · next ${Math.max(0, relayRemain).toFixed(1)}s`}
        </p>
        <div className="mt-2 flex items-center gap-1">
          {(["off", "random", "sequence"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`h-8 rounded-md px-2 text-[11px] capitalize ${
                relayMode === m ? "bg-solar/20 text-peach" : "bg-solar/5 text-peach/50 hover:bg-solar/12 hover:text-peach"
              }`}
              onClick={() => onRelayMode(m)}
            >
              {m === "off" ? "Hold" : m === "random" ? "Random" : "Sequence"}
            </button>
          ))}
          <button
            type="button"
            className={`ml-0.5 h-8 rounded-md px-2 text-[11px] ${
              relayLoop ? "bg-solar/20 text-peach" : "bg-solar/5 text-peach/45 hover:text-peach"
            }`}
            onClick={() => onRelayLoop(!relayLoop)}
            title="Loop the relay"
          >
            Loop
          </button>
          <input
            className="aether-range ml-1 min-w-0 flex-1"
            type="range"
            min={1.5}
            max={24}
            step={0.1}
            value={relayMode === "sequence" ? relayHolds[relayFocus] ?? relayHold : relayHold}
            onChange={(e) => onRelayHold(Number(e.target.value))}
            aria-label="Relay hold"
            disabled={relayMode === "off"}
          />
          <span className="w-8 text-right font-mono text-[11px] tabular-nums text-peach/70">
            {(relayMode === "sequence" ? (relayHolds[relayFocus] ?? relayHold) : relayHold).toFixed(1)}
          </span>
        </div>
        {relayMode !== "off" ? (
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {PALETTE_IDS.map((_, i) => {
              const id = relayMode === "sequence" ? relaySeq[i]! : PALETTE_IDS[i]!;
              const p = PALETTES[id];
              const a = p.colors[0];
              const b = p.colors[p.colors.length - 1];
              const active = relayMode === "sequence" ? i === relayStep : false;
              const focused = relayMode === "sequence" && i === relayFocus;
              return (
                <button
                  key={i}
                  type="button"
                  title={
                    relayMode === "sequence"
                      ? `Step ${i + 1} · ${p.name} · ${(relayHolds[i] ?? relayHold).toFixed(1)}s · click to place current`
                      : p.name
                  }
                  aria-label={`Relay step ${i + 1} ${p.name}`}
                  className={`h-7 rounded-md border ${
                    focused ? "border-peach" : active ? "border-peach/50" : "border-transparent"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, rgb(${a!.join(",")}), rgb(${b!.join(",")}))`,
                    opacity: relayMode === "random" ? 0.7 : 1,
                  }}
                  onClick={() => {
                    if (relayMode === "sequence") {
                      onRelayFocus(i);
                      onRelaySeq(i, palette);
                    }
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-peach/50">Sound</p>
        <label className="mb-2 flex items-center gap-2">
          <span className="w-14 text-xs text-peach/50">Source</span>
          <select
            className="min-h-10 flex-1 rounded-md border border-hair bg-solar/10 px-2 py-1.5 text-sm text-peach"
            value={soundSource}
            onChange={(e) => onSoundSource(e.target.value as SoundSource)}
          >
            <option value="aether">Aether</option>
            <option value="field">Field</option>
            <option value="file">Choose file</option>
          </select>
        </label>
        {soundSource === "file" ? (
          <input
            type="file"
            accept="audio/*"
            className="mb-2 w-full text-xs text-peach/50"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        ) : null}
        <label className="mb-2 flex items-center gap-2">
          <span className="w-14 text-xs text-peach/50">Vol</span>
          <input
            className="aether-range"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolume(Number(e.target.value))}
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="w-14 text-xs text-peach/50">Loop</span>
          <button
            type="button"
            className={`min-h-10 flex-1 rounded-md border text-sm ${
              loop ? "border-solar/45 bg-solar/20 text-peach" : "border-hair bg-solar/5 text-peach/55"
            }`}
            onClick={() => onLoop(!loop)}
          >
            {loop ? "Loop" : "Once"}
          </button>
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-peach/50">Operator</p>
        <p className="mb-2 text-xs text-peach/40">
          {hasOperator
            ? opSession
              ? "Unlocked for a moment"
              : "Key set"
            : "Set a key, then choose whether leaving fullscreen asks for it"}
        </p>
        <div className="mb-1.5 flex gap-1.5">
          <button
            type="button"
            className={`min-h-10 flex-1 rounded-md border text-sm ${
              gateExit && hasOperator
                ? "border-solar/45 bg-solar/20 text-peach"
                : "border-hair bg-solar/8 text-peach/70 hover:bg-solar/16 hover:text-peach"
            }`}
            onClick={() => onGateExit(true)}
          >
            Ask to leave
          </button>
          <button
            type="button"
            className={`min-h-10 flex-1 rounded-md border text-sm ${
              !gateExit
                ? "border-solar/45 bg-solar/20 text-peach"
                : "border-hair bg-solar/8 text-peach/70 hover:bg-solar/16 hover:text-peach"
            }`}
            onClick={() => onGateExit(false)}
          >
            Free exit
          </button>
        </div>
        <p className="mb-2 text-xs text-peach/35">
          {gateExit && hasOperator ? "Password every time you leave fullscreen" : "Leave fullscreen with no key"}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            className="min-h-10 flex-1 rounded-md border border-hair bg-solar/8 text-sm text-peach/70 hover:bg-solar/16 hover:text-peach"
            onClick={hasOperator ? onChangeOperator : onSetOperator}
          >
            {hasOperator ? "Change key" : "Set key"}
          </button>
          <button
            type="button"
            className="min-h-10 flex-1 rounded-md border border-hair bg-solar/8 text-sm text-peach/70 hover:bg-solar/16 hover:text-peach"
            onClick={onLeaveField}
          >
            Leave
          </button>
        </div>
      </section>
    </div>
  );

  if (!open && !mobile) return null;
  if (mobile) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-label="Field">
        <button type="button" className="absolute inset-0 bg-void/70" aria-label="Close field" onClick={onClose} />
        <div className="relative max-h-[78vh] w-full overflow-y-auto rounded-t-2xl border-t border-hair bg-glass px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm uppercase tracking-[0.14em] text-peach">Field</span>
            <button type="button" className="min-h-10 px-3 text-sm text-peach/60" onClick={onClose}>
              Close
            </button>
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={`chrome-fade fixed top-12 right-0 bottom-0 z-30 w-72 overflow-y-auto border-l border-hair bg-glass px-4 py-5 backdrop-blur-xl ${
        open ? "opacity-100" : "pointer-events-none translate-x-full opacity-0"
      }`}
      aria-hidden={!open}
    >
      {body}
    </aside>
  );
}