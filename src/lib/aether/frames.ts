const KEY = "aether-frames-v1";
const MAX = 8;

export interface FrameThumb {
  id: string;
  dataUrl: string;
  ts: number;
}

export function loadFrames(): FrameThumb[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FrameThumb[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function saveFrame(dataUrl: string): FrameThumb[] {
  const frames = loadFrames();
  const next: FrameThumb = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dataUrl,
    ts: Date.now(),
  };
  frames.unshift(next);
  if (frames.length > MAX) frames.length = MAX;
  try {
    localStorage.setItem(KEY, JSON.stringify(frames));
  } catch {
    /* quota */
  }
  return frames;
}

export function removeFrame(id: string): FrameThumb[] {
  const frames = loadFrames().filter((f) => f.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(frames));
  } catch {
    /* quota */
  }
  return frames;
}
