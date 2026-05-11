import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { FrameworkSelector, FrameworkId, FRAMEWORKS } from "@/components/FrameworkSelector";
import { CategoryCard } from "@/components/CategoryCard";
import { ClassificationPanel } from "@/components/ClassificationPanel";
import { FrameworkOutputCard } from "@/components/FrameworkOutputCard";
import { Button } from "@/components/ui/button";
import { VisualizationLightbox, LightboxContent } from "@/components/VisualizationLightbox";
import {
  useClassifyQuery,
  useVisualizeMatplotlib,
  useVisualizeRecharts,
  useVisualizeD3,
  useVisualizeManim,
  useVisualizeGoogleImage,
  type QueryIntent,
} from "@workspace/api-client-react";
import {
  GitBranch,
  TrendingUp,
  RotateCcw,
  Waves,
  Atom,
  Paperclip,
  X,
  Home as HomeIcon,
  Maximize2,
} from "lucide-react";
import { motion } from "framer-motion";

import img_q31 from "@assets/q_(67)_1778488250357.png";
import img_q33 from "@assets/q_(68)_1778488250357.png";
import img_q39 from "@assets/q_(69)_1778488250358.png";
import img_q47 from "@assets/q_(70)_1778488250358.png";
import img_q55 from "@assets/q_(71)_1778488250358.png";
import img_q65 from "@assets/q_(72)_1778488250359.png";
import img_q71 from "@assets/q_(73)_1778488250359.png";
import img_q95 from "@assets/q_(74)_1778488250359.png";
import img_q27 from "@assets/q_(75)_1778488250359.png";

import ans_q31 from "@assets/a_(40)_1778489548406.png";
import ans_q33 from "@assets/a_(41)_1778489548406.png";
import ans_q39 from "@assets/a_(42)_1778489548406.png";
import ans_q47 from "@assets/a_(43)_1778489548406.png";
import ans_q55 from "@assets/a_(37)_1778489548405.png";
import ans_q65 from "@assets/a_(38)_1778489548405.png";
import ans_q71 from "@assets/a_(39)_1778489548405.png";
import ans_q95 from "@assets/a_(36)_1778489548404.png";
import ans_q27 from "@assets/a_(35)_1778489548404.png";

const CATEGORIES = [
  {
    id: "kinematics",
    title: "Motion / Kinematics Plots",
    description: "Position vs time, velocity vs time, acceleration vs time, graph interpretation",
    icon: TrendingUp,
    examples: [
      "Sketch the velocity-versus-time graph from the following position-versus-time graph.",
      "Given the following velocity-versus-time graph, sketch the position-versus-time graph.",
      "Sketch the acceleration-versus-time graph from the following velocity-versus-time graph.",
      "Sketch a graph of acceleration vs time corresponding to the graph of velocity vs time given. Identify the time(s) at which the acceleration has the greatest positive value, is zero, and is negative.",
    ],
    exampleImages: [img_q31, img_q33, img_q39, img_q47],
    recommended: ["Matplotlib", "Recharts", "D3.js"],
  },
  {
    id: "free-body",
    title: "Free-Body / Force Balance Diagrams",
    description: "Forces on objects, tension, normal force, pulleys, equilibrium",
    icon: GitBranch,
    examples: [
      "A leg is suspended in a traction system as shown. Which pulley is used to calculate the force on the foot? What is the tension in the rope? Express answers in terms of the unknown masses and angle.",
      "Consider the baby being weighed in the figure. What is the mass of the infant and basket if a scale reading of 55 N is observed? What is tension T₁ in the cord attaching the baby to the scale? What is tension T₂ in the cord attaching the scale to the ceiling if the scale has a mass of 0.500 kg?",
      "The traffic light hangs from the cables as shown. Draw a free-body diagram on a coordinate plane for this situation.",
    ],
    exampleImages: [img_q55, img_q65, img_q71],
    recommended: ["D3.js", "Google Image", "Manim"],
  },
  {
    id: "circular",
    title: "Circular Motion / Rotation Diagrams",
    description: "Circular motion, angular momentum, torque, rotational dynamics",
    icon: RotateCcw,
    examples: [
      "The truck shown is initially at rest with a solid cylindrical roll of paper sitting on its bed. If the truck moves forward with a uniform acceleration a, what distance s does it move before the paper rolls off its back end?",
    ],
    exampleImages: [img_q95],
    recommended: ["D3.js", "Manim", "Google Image"],
  },
  {
    id: "waves",
    title: "Wave Visualizations",
    description: "Wave superposition, interference, discrete signals, digital-to-analog",
    icon: Waves,
    examples: [
      "What is the result of the superposition of the two mechanical wave signals shown? Each is a discrete (digital) step-function signal, like those from an analog-to-digital converter.",
    ],
    exampleImages: [img_q27],
    recommended: ["Matplotlib", "Recharts", "D3.js", "Manim"],
  },
];

const QUERY_REFS: Record<string, { question: string; answer: string }> = {
  "Sketch the velocity-versus-time graph from the following position-versus-time graph.": {
    question: img_q31,
    answer: ans_q31,
  },
  "Given the following velocity-versus-time graph, sketch the position-versus-time graph.": {
    question: img_q33,
    answer: ans_q33,
  },
  "Sketch the acceleration-versus-time graph from the following velocity-versus-time graph.": {
    question: img_q39,
    answer: ans_q39,
  },
  "Sketch a graph of acceleration vs time corresponding to the graph of velocity vs time given. Identify the time(s) at which the acceleration has the greatest positive value, is zero, and is negative.": {
    question: img_q47,
    answer: ans_q47,
  },
  "A leg is suspended in a traction system as shown. Which pulley is used to calculate the force on the foot? What is the tension in the rope? Express answers in terms of the unknown masses and angle.": {
    question: img_q55,
    answer: ans_q55,
  },
  "Consider the baby being weighed in the figure. What is the mass of the infant and basket if a scale reading of 55 N is observed? What is tension T₁ in the cord attaching the baby to the scale? What is tension T₂ in the cord attaching the scale to the ceiling if the scale has a mass of 0.500 kg?": {
    question: img_q65,
    answer: ans_q65,
  },
  "The traffic light hangs from the cables as shown. Draw a free-body diagram on a coordinate plane for this situation.": {
    question: img_q71,
    answer: ans_q71,
  },
  "The truck shown is initially at rest with a solid cylindrical roll of paper sitting on its bed. If the truck moves forward with a uniform acceleration a, what distance s does it move before the paper rolls off its back end?": {
    question: img_q95,
    answer: ans_q95,
  },
  "What is the result of the superposition of the two mechanical wave signals shown? Each is a discrete (digital) step-function signal, like those from an analog-to-digital converter.": {
    question: img_q27,
    answer: ans_q27,
  },
};

async function resizeImageDataUrl(dataUrl: string, maxWidth = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
}

const MAX_TEXTAREA_HEIGHT = 200;

export default function Home() {
  const [query, setQuery] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [selectedFrameworks, setSelectedFrameworks] = useState<Set<FrameworkId>>(
    new Set(FRAMEWORKS.map((fw) => fw.id as FrameworkId))
  );
  const [refImages, setRefImages] = useState<{ question: string | null; answer: string | null }>({
    question: null,
    answer: null,
  });
  const [refLightbox, setRefLightbox] = useState<LightboxContent | null>(null);
  const [vizStartTime, setVizStartTime] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const classifyQuery = useClassifyQuery();
  const visMatplotlib = useVisualizeMatplotlib();
  const visRecharts = useVisualizeRecharts();
  const visD3 = useVisualizeD3();
  const visManim = useVisualizeManim();
  const visGoogleImage = useVisualizeGoogleImage();

  const unsuitableFrameworks = useMemo<Set<FrameworkId>>(() => {
    if (!classifyQuery.data) return new Set();
    const recommended = new Set(
      classifyQuery.data.recommended_frameworks.map((f) => f.replace(/_/g, "-"))
    );
    return new Set(
      FRAMEWORKS
        .filter((fw) => !recommended.has(fw.id) && fw.id !== "google-image")
        .map((fw) => fw.id as FrameworkId)
    );
  }, [classifyQuery.data]);

  const autoGrowTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
  }, []);

  useEffect(() => {
    autoGrowTextarea();
  }, [query, autoGrowTextarea]);

  const resetAll = useCallback(() => {
    setQuery("");
    setAttachedImage(null);
    setRefImages({ question: null, answer: null });
    setVizStartTime(null);
    classifyQuery.reset();
    visMatplotlib.reset();
    visRecharts.reset();
    visD3.reset();
    visManim.reset();
    visGoogleImage.reset();
    setSelectedFrameworks(new Set(FRAMEWORKS.map((fw) => fw.id as FrameworkId)));
  }, [classifyQuery, visMatplotlib, visRecharts, visD3, visManim, visGoogleImage]);

  const runVisualizations = useCallback(
    (q: string, intent: QueryIntent, frameworks: Set<FrameworkId>, imgBase64?: string | null) => {
      const imageContext = imgBase64 ?? null;
      const t = Date.now();
      setVizStartTime(t);
      if (frameworks.has("matplotlib")) visMatplotlib.mutate({ data: { query: q, intent, imageContext } });
      if (frameworks.has("recharts")) visRecharts.mutate({ data: { query: q, intent, imageContext } });
      if (frameworks.has("d3")) visD3.mutate({ data: { query: q, intent, imageContext } });
      if (frameworks.has("manim")) visManim.mutate({ data: { query: q, intent, imageContext } });
      visGoogleImage.mutate({ data: { query: q, intent, imageContext } });
    },
    [visMatplotlib, visRecharts, visD3, visManim, visGoogleImage]
  );

  const handleVisualize = useCallback(
    async (q: string, imageDataUrl?: string) => {
      if (!q.trim()) return;

      const rawDataUrl = imageDataUrl ?? attachedImage ?? undefined;
      let imageBase64: string | undefined;
      if (rawDataUrl) {
        const resized = await resizeImageDataUrl(rawDataUrl);
        imageBase64 = stripDataUrlPrefix(resized);
      }

      classifyQuery.mutate(
        { data: { query: q, imageContext: imageBase64 ?? null } },
        {
          onSuccess: (intent) => {
            const recommended = new Set(
              intent.recommended_frameworks.map((f) => f.replace(/_/g, "-") as FrameworkId)
            );
            const effectiveFrameworks = new Set([
              ...[...selectedFrameworks].filter((fw) => recommended.has(fw) || fw === "google-image"),
              "google-image" as FrameworkId,
            ]) as Set<FrameworkId>;
            const toRun = effectiveFrameworks.size > 0 ? effectiveFrameworks : new Set([...recommended, "google-image" as FrameworkId]);
            setSelectedFrameworks(toRun);
            runVisualizations(q, intent, toRun, imageBase64);
          },
        }
      );
    },
    [attachedImage, classifyQuery, runVisualizations, selectedFrameworks]
  );

  const handleSelectQuery = useCallback(
    async (q: string, imageUrl?: string) => {
      setQuery(q);
      const refs = QUERY_REFS[q] ?? null;
      setRefImages({ question: refs?.question ?? null, answer: refs?.answer ?? null });

      if (imageUrl) {
        try {
          const resp = await fetch(imageUrl);
          const blob = await resp.blob();
          const reader = new FileReader();
          reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            const resized = await resizeImageDataUrl(dataUrl);
            setAttachedImage(resized);
            handleVisualize(q, resized);
          };
          reader.readAsDataURL(blob);
        } catch {
          handleVisualize(q);
        }
      } else {
        handleVisualize(q);
      }
    },
    [handleVisualize]
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const resized = await resizeImageDataUrl(dataUrl);
      setAttachedImage(resized);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isActive = classifyQuery.data != null || classifyQuery.isPending || classifyQuery.isError;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-sans">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={resetAll}
              className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30 transition-colors"
              title="Return to home"
            >
              <Atom className="w-6 h-6 text-primary" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Medhavy Physics Engine Playground</h1>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">Compare visualization frameworks for physics education</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isActive && (
              <button
                onClick={resetAll}
                className="flex items-center gap-2 text-sm font-semibold text-foreground bg-muted hover:bg-muted/80 transition-colors px-4 py-2 rounded-lg border border-border"
              >
                <HomeIcon className="w-4 h-4" />
                ← Back to Home
              </button>
            )}
            <span className="hidden md:block px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-mono font-medium border border-border/50">
              Medhavy AI / OpenStax Research
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-mono">Frameworks</h2>
              <FrameworkSelector
                selected={selectedFrameworks}
                onChange={setSelectedFrameworks}
                unsuitable={classifyQuery.data ? unsuitableFrameworks : undefined}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-card/50 border border-border/50 rounded-xl shadow-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <textarea
                  ref={textareaRef}
                  data-testid="query-input"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    autoGrowTextarea();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleVisualize(query);
                    }
                  }}
                  placeholder="Type a physics question, or click an example below… (Shift+Enter for new line)"
                  style={{
                    minHeight: "72px",
                    maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
                    overflowY: "auto",
                    resize: "none",
                    height: "72px",
                  }}
                  className="w-full text-base p-4 pb-2 bg-transparent outline-none font-sans placeholder:text-muted-foreground/50"
                />

                {attachedImage && (
                  <div className="flex items-center gap-2 px-4 pb-2">
                    <div className="relative group">
                      <img
                        src={attachedImage}
                        alt="Attached"
                        className="h-12 w-16 object-cover rounded border border-border/50"
                      />
                      <button
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">Question image attached — AI will use it to generate matching visualizations</span>
                  </div>
                )}

                <div className="flex items-center justify-between px-3 pb-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach a graph or diagram image for context"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-muted/50"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    data-testid="submit-button"
                    onClick={() => handleVisualize(query)}
                    disabled={!query.trim() || classifyQuery.isPending}
                    className="rounded-lg font-mono text-sm px-6 h-8"
                  >
                    {classifyQuery.isPending ? "Classifying…" : "Visualize →"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {classifyQuery.data && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6"
            >
              <ClassificationPanel intent={classifyQuery.data} />
            </motion.div>
          )}

          {isActive && (refImages.question || refImages.answer) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/30 p-4"
            >
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Reference — OpenStax Source
              </p>
              <div className="flex gap-6 flex-wrap">
                {refImages.question && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground font-mono">Question diagram</span>
                    <div
                      className="relative group cursor-zoom-in"
                      onClick={() =>
                        setRefLightbox({ type: "image", src: refImages.question!, alt: "Question diagram" })
                      }
                    >
                      <img
                        src={refImages.question}
                        alt="Question diagram"
                        className="h-36 max-w-[240px] object-contain rounded-lg border border-border/60 bg-white/5 hover:border-primary/50 transition-colors"
                      />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/60 rounded p-1">
                          <Maximize2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {refImages.answer && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted-foreground font-mono">OpenStax answer</span>
                    <div
                      className="relative group cursor-zoom-in"
                      onClick={() =>
                        setRefLightbox({ type: "image", src: refImages.answer!, alt: "OpenStax answer" })
                      }
                    >
                      <img
                        src={refImages.answer}
                        alt="OpenStax answer"
                        className="h-36 max-w-[340px] object-contain rounded-lg border border-border/60 bg-white hover:border-primary/50 transition-colors p-1"
                      />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/60 rounded p-1">
                          <Maximize2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {isActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 border-t border-border/30">
              {selectedFrameworks.has("matplotlib") && (
                <FrameworkOutputCard
                  frameworkId="matplotlib"
                  isLoading={visMatplotlib.isPending}
                  data={visMatplotlib.data}
                  error={visMatplotlib.error}
                  visualType={classifyQuery.data?.visual_type}
                  startedAt={vizStartTime}
                />
              )}
              {selectedFrameworks.has("recharts") && (
                <FrameworkOutputCard
                  frameworkId="recharts"
                  isLoading={visRecharts.isPending}
                  data={visRecharts.data}
                  error={visRecharts.error}
                  visualType={classifyQuery.data?.visual_type}
                  startedAt={vizStartTime}
                />
              )}
              {selectedFrameworks.has("d3") && (
                <FrameworkOutputCard
                  frameworkId="d3"
                  isLoading={visD3.isPending}
                  data={visD3.data}
                  error={visD3.error}
                  visualType={classifyQuery.data?.visual_type}
                  startedAt={vizStartTime}
                />
              )}
              {selectedFrameworks.has("manim") && (
                <FrameworkOutputCard
                  frameworkId="manim"
                  isLoading={visManim.isPending}
                  data={visManim.data}
                  error={visManim.error}
                  visualType={classifyQuery.data?.visual_type}
                  startedAt={vizStartTime}
                />
              )}
              {selectedFrameworks.has("google-image") && (
                <FrameworkOutputCard
                  frameworkId="google-image"
                  isLoading={visGoogleImage.isPending}
                  data={visGoogleImage.data}
                  error={visGoogleImage.error}
                  visualType={classifyQuery.data?.visual_type}
                  startedAt={vizStartTime}
                />
              )}
            </div>
          )}
        </div>

        {!isActive && (
          <div className="mt-12 space-y-6">
            <h2 className="text-lg font-bold font-mono text-foreground/80 flex items-center gap-2 max-w-5xl mx-auto">
              <span className="w-8 h-[1px] bg-border block" />
              Click a question to visualize it
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  {...category}
                  exampleImages={category.exampleImages}
                  onSelectQuery={handleSelectQuery}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <VisualizationLightbox content={refLightbox} onClose={() => setRefLightbox(null)} />
    </div>
  );
}
