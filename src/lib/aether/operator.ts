/**
 * Device operator lock. A hashed key on this machine gates
 * exit-fullscreen, hide/show chrome, and leave-field.
 * Session lives in memory only. SSO can later sit beside verify().
 */

const STORE = "aether-operator-v1";
const SESSION_MS = 90_000;
const ITER = 120_000;

export type OperatorCommand = "exit-fullscreen" | "hide" | "show" | "leave" | "setup" | "change" | "unlock-exit";

interface Record {
  salt: string;
  hash: string;
  iter: number;
  gateExit?: boolean;
}

let sessionUntil = 0;

function b64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function fromB64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function read(): Record | null {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const v = JSON.parse(raw) as Record;
    if (!v.salt || !v.hash) return null;
    return v;
  } catch {
    return null;
  }
}

async function derive(pin: string, salt: Uint8Array, iter: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: iter },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function same(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i]! ^ b[i]!;
  return d === 0;
}

export const operator = {
  hasKey() {
    return Boolean(read());
  },

  isSessionOpen() {
    return Date.now() < sessionUntil;
  },

  sessionRemain() {
    return Math.max(0, sessionUntil - Date.now());
  },

  openSession() {
    sessionUntil = Date.now() + SESSION_MS;
  },

  closeSession() {
    sessionUntil = 0;
  },

  async setKey(pin: string) {
    const clean = pin.trim();
    if (clean.length < 4) throw new Error("Key needs 4 characters or more");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(clean, salt, ITER);
    const rec: Record = { salt: b64(salt), hash: b64(hash), iter: ITER, gateExit: read()?.gateExit ?? true };
    localStorage.setItem(STORE, JSON.stringify(rec));
    this.openSession();
  },

  gateExit() {
    const rec = read();
    if (!rec) return false;
    return rec.gateExit !== false;
  },

  setGateExit(on: boolean) {
    const rec = read();
    if (!rec) return;
    rec.gateExit = on;
    localStorage.setItem(STORE, JSON.stringify(rec));
  },

  async verify(pin: string) {
    const rec = read();
    if (!rec) return false;
    const hash = await derive(pin.trim(), fromB64(rec.salt), rec.iter || ITER);
    const ok = same(hash, fromB64(rec.hash));
    if (ok) this.openSession();
    return ok;
  },

  clearKey() {
    localStorage.removeItem(STORE);
    this.closeSession();
  },
};
