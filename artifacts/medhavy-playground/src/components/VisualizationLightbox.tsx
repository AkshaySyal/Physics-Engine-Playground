import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";

export type LightboxContent =
  | { type: "image"; src: string; alt?: string }
  | { type: "svg"; html: string }
  | { type: "component"; element: ReactNode };

interface VisualizationLightboxProps {
  content: LightboxContent | null;
  onClose: () => void;
}

export function VisualizationLightbox({ content, onClose }: VisualizationLightboxProps) {
  useEffect(() => {
    if (!content) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [content, onClose]);

  if (!content) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col items-center gap-3"
        style={{ maxWidth: "95vw", maxHeight: "95vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          className="self-end text-white/70 hover:text-white hover:bg-white/10 gap-1.5"
          onClick={onClose}
        >
          <X className="w-4 h-4" /> Close
        </Button>

        {content.type === "image" && (
          <img
            src={content.src}
            alt={content.alt ?? "Visualization"}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        )}

        {content.type === "svg" && (
          <div
            className="bg-slate-900 rounded-xl p-4 shadow-2xl overflow-auto"
            style={{ maxHeight: "85vh" }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content.html, {
                USE_PROFILES: { svg: true, svgFilters: true },
                ADD_TAGS: ["style", "animate", "animateTransform", "animateMotion", "mpath"],
                FORBID_TAGS: ["script"],
                FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
              }),
            }}
          />
        )}

        {content.type === "component" && (
          <div
            className="bg-card rounded-xl shadow-2xl overflow-auto"
            style={{ width: "min(90vw, 1000px)", height: "min(80vh, 700px)", padding: "24px" }}
          >
            {content.element}
          </div>
        )}
      </div>
    </div>
  );
}
