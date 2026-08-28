import { APP_VERSION } from "@/lib/aether/version";

export function VersionBadge({ visible }: { visible: boolean }) {
  return (
    <p
      className={`version-badge pointer-events-none fixed z-[55] font-sans tracking-widest text-peach ${
        visible ? "" : "hidden opacity-0"
      }`}
      aria-label={`Aether version ${APP_VERSION}`}
    >
      v{APP_VERSION}
    </p>
  );
}
