import { useEffect, useRef, useState } from "react";
import { operator, type OperatorCommand } from "@/lib/aether/operator";

interface Props {
  open: boolean;
  mode: "setup" | "verify" | "change";
  command: OperatorCommand;
  onCancel: () => void;
  onVerified: (command: OperatorCommand) => void;
  onSet: () => void;
}

function copy(mode: Props["mode"], command: OperatorCommand) {
  if (mode === "setup") {
    return {
      title: "Operator",
      body: "A key for this machine. Needed to leave fullscreen, hide the chrome, or go.",
    };
  }
  if (mode === "change") {
    return { title: "Change key", body: "Current key, then a new one." };
  }
  if (command === "exit-fullscreen") return { title: "Operator", body: "To leave fullscreen." };
  if (command === "unlock-exit") return { title: "Operator", body: "To leave fullscreen without a key." };
  if (command === "hide") return { title: "Operator", body: "To hide the controls." };
  if (command === "show") return { title: "Operator", body: "To show the controls." };
  if (command === "leave") return { title: "Operator", body: "To leave the field." };
  return { title: "Operator", body: "To continue." };
}

export function OperatorGate({ open, mode, command, onCancel, onVerified, onSet }: Props) {
  const [pin, setPin] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setNext("");
    setErr("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open, mode, command]);

  if (!open) return null;

  const text = copy(mode, command);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try {
      if (mode === "setup") {
        await operator.setKey(pin);
        onSet();
      } else if (mode === "change") {
        const ok = await operator.verify(pin);
        if (!ok) {
          setErr("Not the current key");
          return;
        }
        await operator.setKey(next);
        onSet();
      } else {
        const ok = await operator.verify(pin);
        if (!ok) {
          setErr("Not the key");
          return;
        }
        onVerified(command);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-void/70" aria-label="Cancel" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-hair bg-glass p-5 shadow-none backdrop-blur-xl"
        role="dialog"
        aria-label={text.title}
      >
        <p className="font-display text-2xl font-light tracking-wide text-peach">{text.title}</p>
        <p className="mt-1.5 mb-5 text-xs leading-relaxed text-peach/50">{text.body}</p>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-peach/45">
            {mode === "change" ? "Current" : "Key"}
          </span>
          <input
            ref={inputRef}
            type="password"
            autoComplete="off"
            className="min-h-11 w-full rounded-md border border-hair bg-solar/10 px-3 text-sm text-peach outline-none focus:border-solar/50"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
              if (e.key === "Escape") onCancel();
            }}
          />
        </label>
        {mode === "change" ? (
          <label className="mb-3 block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-peach/45">New</span>
            <input
              type="password"
              autoComplete="off"
              className="min-h-11 w-full rounded-md border border-hair bg-solar/10 px-3 text-sm text-peach outline-none focus:border-solar/50"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
            />
          </label>
        ) : null}
        {err ? <p className="mb-3 text-xs text-solar">{err}</p> : null}
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-md border border-hair text-sm text-peach/55 hover:text-peach"
            onClick={onCancel}
          >
            {mode === "setup" ? "Not now" : "Stay"}
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-md border border-solar/40 bg-solar/15 text-sm tracking-[0.08em] text-peach uppercase hover:bg-solar/25"
            onClick={() => void submit()}
            disabled={busy}
          >
            {mode === "setup" || mode === "change" ? "Set" : "Open"}
          </button>
        </div>
      </div>
    </div>
  );
}
