import type { FrameThumb } from "@/lib/aether/frames";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  frames: FrameThumb[];
  onClose: () => void;
  onDownload: (f: FrameThumb) => void;
  onRemove: (id: string) => void;
}

export function Gallery({ open, frames, onClose, onDownload, onRemove }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-void/92 p-4 backdrop-blur-md" role="dialog" aria-label="Gallery">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-peach">Gallery</h2>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-md text-peach/60 hover:bg-solar/12 hover:text-peach"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="size-5" strokeWidth={1.6} />
        </button>
      </div>
      {frames.length === 0 ? (
        <p className="mt-16 text-center text-sm text-peach/50">No frames yet. Press S to capture.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {frames.map((f) => (
            <div key={f.id} className="relative overflow-hidden rounded-lg border border-hair bg-void-soft">
              <img src={f.dataUrl} alt="Saved frame" className="aspect-video w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-void/90 to-transparent p-2">
                <button
                  type="button"
                  className="min-h-10 flex-1 rounded-sm bg-solar/25 text-xs text-peach"
                  onClick={() => onDownload(f)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="min-h-10 flex-1 rounded-sm bg-solar/15 text-xs text-peach/80"
                  onClick={() => onRemove(f.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
