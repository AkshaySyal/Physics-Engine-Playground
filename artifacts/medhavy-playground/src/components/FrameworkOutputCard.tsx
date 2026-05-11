import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FRAMEWORKS, FrameworkId } from "./FrameworkSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { RechartsRenderer } from "./RechartsRenderer";
import { Button } from "@/components/ui/button";
import { Copy, Maximize2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { VisualizationLightbox, LightboxContent } from "./VisualizationLightbox";
import type {
  MatplotlibOutput,
  RechartsOutput,
  D3Output,
  ManimOutput,
  GoogleImageOutput,
} from "@workspace/api-client-react";

type FrameworkData =
  | MatplotlibOutput
  | RechartsOutput
  | D3Output
  | ManimOutput
  | GoogleImageOutput;

interface FrameworkOutputCardProps {
  frameworkId: FrameworkId;
  isLoading: boolean;
  data: FrameworkData | undefined;
  error?: Error | null;
  visualType?: string;
  startedAt?: number | null;
}

export function FrameworkOutputCard({ frameworkId, isLoading, data, error, visualType, startedAt }: FrameworkOutputCardProps) {
  const fw = FRAMEWORKS.find((f) => f.id === frameworkId)!;
  const { toast } = useToast();
  const [lightbox, setLightbox] = useState<LightboxContent | null>(null);
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const capturedRef = useRef(false);
  const prevStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt !== prevStartedAt.current) {
      prevStartedAt.current = startedAt ?? null;
      capturedRef.current = false;
      setLatencyMs(null);
    }
  }, [startedAt]);

  useEffect(() => {
    if (data && !capturedRef.current && startedAt) {
      capturedRef.current = true;
      setLatencyMs(Date.now() - startedAt);
    }
  }, [data, startedAt]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Script copied successfully.",
    });
  };

  const sanitizeSvgForDisplay = (svg: string) =>
    DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ["style", "animate", "animateTransform", "animateMotion", "mpath"],
      FORBID_TAGS: ["script"],
      FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
    });

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-[300px]" />;
    }

    if (error) {
      return (
        <div className="flex h-[300px] items-center justify-center text-destructive text-sm text-center px-4">
          Failed to load visualization. Please try again.
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
          Waiting for query...
        </div>
      );
    }

    if (data.suitable === false) {
      return (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground bg-muted/10 rounded-md p-4 text-center text-sm">
          Not suitable for this visualization type.
          {data.note && (
            <span className="block mt-2 text-xs opacity-70">{data.note}</span>
          )}
        </div>
      );
    }

    if (frameworkId === "matplotlib") {
      const d = data as MatplotlibOutput;
      if (!d.imageBase64) {
        return (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            No image generated.
          </div>
        );
      }
      const src = `data:image/png;base64,${d.imageBase64}`;
      return (
        <div className="relative group cursor-zoom-in" onClick={() => setLightbox({ type: "image", src, alt: "Matplotlib visualization" })}>
          <img
            src={src}
            alt="Matplotlib visualization output"
            className="max-w-full h-auto max-h-[400px] object-contain mx-auto rounded"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 rounded p-1">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    if (frameworkId === "recharts") {
      const d = data as RechartsOutput;
      return (
        <div
          className="relative group w-full cursor-zoom-in"
          onClick={() =>
            setLightbox({
              type: "component",
              element: <div style={{ width: "100%", height: "500px" }}><RechartsRenderer {...d} /></div>,
            })
          }
        >
          <RechartsRenderer {...d} />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-1 pointer-events-none">
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        </div>
      );
    }

    if (frameworkId === "d3") {
      const d = data as D3Output;
      if (!d.svgContent) {
        return (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            No diagram generated.
          </div>
        );
      }
      const cleanSvg = sanitizeSvgForDisplay(d.svgContent);
      return (
        <div
          className="relative group cursor-zoom-in flex justify-center items-center w-full min-h-[300px] overflow-hidden bg-white/5 rounded-md p-2"
          onClick={() => setLightbox({ type: "svg", html: cleanSvg })}
        >
          <div dangerouslySetInnerHTML={{ __html: cleanSvg }} />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 rounded p-1">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    if (frameworkId === "manim") {
      const d = data as ManimOutput;
      const cleanSvg = d.animatedSvg ? sanitizeSvgForDisplay(d.animatedSvg) : null;

      return (
        <div className="flex flex-col gap-3 min-h-[300px]">
          {cleanSvg ? (
            <div
              className="relative group cursor-zoom-in flex justify-center items-center w-full overflow-hidden bg-slate-900 rounded-md"
              onClick={() => setLightbox({ type: "svg", html: cleanSvg })}
            >
              <div dangerouslySetInnerHTML={{ __html: cleanSvg }} className="w-full" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 rounded p-1">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ) : null}

          {d.script && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground bg-muted/20 rounded-md">
                <button
                  onClick={() => setScriptExpanded((v) => !v)}
                  className="flex items-center gap-2 hover:text-foreground transition-colors flex-1 min-w-0"
                >
                  <span className="font-mono truncate">
                    Scene: <span className="text-accent">{d.sceneClass}</span>
                  </span>
                  {scriptExpanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                </button>
                <button
                  onClick={() => copyToClipboard(d.script!)}
                  className="flex items-center gap-1 font-mono hover:text-foreground transition-colors ml-2 px-2 py-0.5 rounded hover:bg-muted/60"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              {scriptExpanded && (
                <pre className="p-3 bg-muted/30 rounded-md overflow-auto text-xs font-mono text-foreground/90 whitespace-pre-wrap max-h-[300px]">
                  {d.script}
                </pre>
              )}
            </div>
          )}

          {!cleanSvg && !d.script && (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              No output generated.
            </div>
          )}
        </div>
      );
    }

    if (frameworkId === "google-image") {
      const d = data as GoogleImageOutput;
      if (!d.imageBase64) {
        return (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            No image generated.
          </div>
        );
      }
      const src = `data:${d.mimeType ?? "image/png"};base64,${d.imageBase64}`;
      return (
        <div className="relative group cursor-zoom-in" onClick={() => setLightbox({ type: "image", src, alt: "AI-generated physics diagram" })}>
          <img
            src={src}
            alt="AI-generated physics diagram"
            className="max-w-full h-auto max-h-[400px] object-contain mx-auto rounded-md"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 rounded p-1">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const getStatus = () => {
    if (isLoading) return { label: "Generating...", className: "text-primary/80" };
    if (error) return { label: "Error", className: "text-destructive" };
    if (!data) return { label: "Waiting", className: "text-muted-foreground" };
    if (data.suitable === false) return { label: "Not Suitable", className: "text-muted-foreground" };
    return { label: "Ready", className: "text-green-500" };
  };

  const status = getStatus();
  const renderTimeMs = (data as MatplotlibOutput)?.renderTimeMs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="h-full flex flex-col overflow-hidden" data-testid={`output-card-${frameworkId}`}>
        <CardHeader className="py-3 px-4 border-b bg-muted/10 flex flex-col gap-1.5 space-y-0">
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 font-mono font-semibold">
              <div className={`w-2.5 h-2.5 rounded-full ${fw.color} shrink-0`} />
              {fw.name}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-mono ${status.className}`}>{status.label}</span>
              {latencyMs != null && (
                <Badge variant="outline" className="font-mono text-xs h-5 px-1.5 text-cyan-400 border-cyan-400/40">
                  {latencyMs.toLocaleString()}ms
                </Badge>
              )}
              {renderTimeMs != null && (
                <Badge variant="outline" className="font-mono text-xs text-muted-foreground h-5 px-1.5">
                  render {renderTimeMs}ms
                </Badge>
              )}
            </div>
          </div>
          {visualType && (
            <p className="text-xs font-mono text-muted-foreground truncate">
              <span className="text-muted-foreground/60">type:</span>{" "}
              <span className="text-accent/80">{visualType.replace(/_/g, " ")}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col min-h-[400px]">
          {renderContent()}
          {data?.suitable !== false && data?.note && frameworkId !== "manim" && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 font-mono">
              {data.note}
            </p>
          )}
        </CardContent>
      </Card>

      <VisualizationLightbox content={lightbox} onClose={() => setLightbox(null)} />
    </motion.div>
  );
}
