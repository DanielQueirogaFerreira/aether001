export type WindMode =
  | "drift"
  | "orbit"
  | "weave"
  | "ember"
  | "tide"
  | "form"
  | "nerve";

export type PaletteId = "solar" | "flare" | "ember" | "jade" | "ion" | "dawn" | "quiet";

export const PALETTE_IDS: PaletteId[] = ["solar", "flare", "ember", "jade", "ion", "dawn", "quiet"];

export type RelayMode = "off" | "random" | "sequence";

export type SoundSource = "aether" | "field" | "file";

export interface Palette {
  id: PaletteId;
  name: string;
  kind: "vivid" | "quiet";
  bg: [number, number, number];
  colors: [number, number, number][];
}

export const WIND_MODES: { id: WindMode; label: string; hint: string }[] = [
  { id: "drift", label: "Drift", hint: "Slow wind through the field" },
  { id: "orbit", label: "Orbit", hint: "Circles touch" },
  { id: "weave", label: "Weave", hint: "Threads find each other" },
  { id: "ember", label: "Ember", hint: "Sparks lift and fade" },
  { id: "tide", label: "Tide", hint: "The whole room rolls" },
  { id: "form", label: "Form", hint: "A body gathers, then transcends" },
  { id: "nerve", label: "Nerve", hint: "The cord remembers the whole room" },
];

export const FORM_DELAY_KEYS = ["t1", "t2", "t3", "t5", "t7"] as const;
export type FormDelayKey = (typeof FORM_DELAY_KEYS)[number];

export type FormDelays = Record<FormDelayKey, number>;

export const FORM_DELAY_META: { key: FormDelayKey; label: string; hint: string }[] = [
  { key: "t1", label: "T1 First", hint: "First holds the ring alone" },
  { key: "t2", label: "T2 Second", hint: "A second joins, hands meet" },
  { key: "t3", label: "T3 Third", hint: "Three make an arc" },
  { key: "t5", label: "T5 Fifth", hint: "Five almost close the ring" },
  { key: "t7", label: "T7 Seventh", hint: "Full circle, then back to one" },
];

export const DEFAULT_FORM_DELAYS: FormDelays = {
  t1: 5,
  t2: 4.2,
  t3: 4.2,
  t5: 4.4,
  t7: 5.6,
};

export const PALETTES: Record<PaletteId, Palette> = {
  solar: {
    id: "solar",
    name: "Solar",
    kind: "vivid",
    bg: [5, 5, 5],
    colors: [
      [179, 58, 0],
      [240, 90, 0],
      [255, 140, 42],
      [255, 224, 194],
    ],
  },
  flare: {
    id: "flare",
    name: "Flare",
    kind: "vivid",
    bg: [6, 2, 3],
    colors: [
      [140, 8, 22],
      [220, 18, 42],
      [255, 64, 72],
      [255, 188, 186],
    ],
  },
  ember: {
    id: "ember",
    name: "Ember",
    kind: "vivid",
    bg: [8, 4, 3],
    colors: [
      [90, 22, 0],
      [180, 48, 0],
      [232, 96, 24],
      [255, 186, 110],
    ],
  },
  jade: {
    id: "jade",
    name: "Jade",
    kind: "vivid",
    bg: [2, 6, 4],
    colors: [
      [8, 88, 42],
      [20, 176, 78],
      [72, 232, 130],
      [198, 255, 214],
    ],
  },
  ion: {
    id: "ion",
    name: "Ion",
    kind: "vivid",
    bg: [3, 4, 10],
    colors: [
      [16, 48, 160],
      [36, 110, 255],
      [90, 186, 255],
      [196, 232, 255],
    ],
  },
  dawn: {
    id: "dawn",
    name: "Dawn",
    kind: "quiet",
    bg: [6, 5, 8],
    colors: [
      [70, 42, 48],
      [160, 88, 70],
      [220, 150, 120],
      [255, 228, 210],
    ],
  },
  quiet: {
    id: "quiet",
    name: "Quiet",
    kind: "quiet",
    bg: [6, 6, 8],
    colors: [
      [42, 42, 52],
      [90, 88, 100],
      [168, 166, 176],
      [228, 226, 232],
    ],
  },
};
