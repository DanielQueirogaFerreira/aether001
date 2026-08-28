import { APP_VERSION } from "@/lib/aether/version";

export function VersionBadge() {
  return (
    <p
      className="version-badge pointer-events-none fixed z-[55] font-sans text-xs tracking-widest text-peach"
      aria-label={`Aether version ${APP_VERSION}`}
    >
      v{APP_VERSION}
    </p>
  );
}
