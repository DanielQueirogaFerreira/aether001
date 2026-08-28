/**
 * Keep the display awake while the field is playing —
 * Screen Wake Lock plus a hidden looping canvas-stream (video-watch trick).
 */

export function createWakeGuard() {
  let lock: WakeLockSentinel | null = null;
  let wanted = false;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let raf = 0;

  function ensureVideo() {
    if (video) return;
    canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, 16, 16);
      raf = requestAnimationFrame(draw);
    };
    draw();
    video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("aria-hidden", "true");
    Object.assign(video.style, {
      position: "fixed",
      width: "2px",
      height: "2px",
      opacity: "0",
      pointerEvents: "none",
      left: "0",
      bottom: "0",
    });
    try {
      video.srcObject = canvas.captureStream(8);
    } catch {
      /* captureStream unavailable */
    }
    document.body.appendChild(video);
  }

  async function acquireLock() {
    if (!wanted) return;
    try {
      const api = navigator.wakeLock;
      if (!api?.request) return;
      lock = await api.request("screen");
      lock.addEventListener("release", () => {
        lock = null;
        if (wanted && document.visibilityState === "visible") void acquireLock();
      });
    } catch {
      /* permission / unsupported */
    }
  }

  async function playVideo() {
    ensureVideo();
    try {
      await video?.play();
    } catch {
      /* autoplay may need a gesture; handleEnter covers that */
    }
  }

  function stopVideo() {
    video?.pause();
  }

  function onVis() {
    if (document.visibilityState === "visible" && wanted) {
      void acquireLock();
      void playVideo();
    }
  }

  document.addEventListener("visibilitychange", onVis);

  return {
    setActive(on: boolean) {
      wanted = on;
      if (on) {
        void acquireLock();
        void playVideo();
      } else {
        stopVideo();
        void lock?.release();
        lock = null;
      }
    },
    destroy() {
      wanted = false;
      document.removeEventListener("visibilitychange", onVis);
      stopVideo();
      cancelAnimationFrame(raf);
      void lock?.release();
      lock = null;
      video?.remove();
      video = null;
      canvas = null;
    },
  };
}
