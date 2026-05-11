import { cn } from "@/lib/utils";

export const FRAMEWORKS = [
  { id: "matplotlib", name: "Matplotlib", color: "bg-orange-500", text: "text-orange-500", border: "border-orange-500" },
  { id: "recharts", name: "Recharts", color: "bg-blue-500", text: "text-blue-500", border: "border-blue-500" },
  { id: "d3", name: "D3.js", color: "bg-green-500", text: "text-green-500", border: "border-green-500" },
  { id: "manim", name: "Manim", color: "bg-purple-500", text: "text-purple-500", border: "border-purple-500" },
  { id: "google-image", name: "Google Image", color: "bg-pink-500", text: "text-pink-500", border: "border-pink-500" },
];

export type FrameworkId = "matplotlib" | "recharts" | "d3" | "manim" | "google-image";

interface FrameworkSelectorProps {
  selected: Set<FrameworkId>;
  onChange: (selected: Set<FrameworkId>) => void;
  unsuitable?: Set<FrameworkId>;
}

export function FrameworkSelector({ selected, onChange, unsuitable }: FrameworkSelectorProps) {
  const toggle = (id: FrameworkId) => {
    if (unsuitable?.has(id)) return;
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FRAMEWORKS.map((fw) => {
        const isSelected = selected.has(fw.id as FrameworkId);
        const isUnsuitable = unsuitable?.has(fw.id as FrameworkId);
        return (
          <div key={fw.id} className="relative group">
            <button
              data-testid={`framework-chip-${fw.id}`}
              onClick={() => toggle(fw.id as FrameworkId)}
              disabled={isUnsuitable}
              aria-disabled={isUnsuitable}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                isUnsuitable
                  ? "bg-muted/10 text-muted-foreground/30 border-border/20 cursor-not-allowed opacity-40 pointer-events-none select-none"
                  : isSelected
                  ? `${fw.color} text-white hover:brightness-110 border-transparent`
                  : `bg-muted/50 ${fw.text} ${fw.border} hover:bg-muted border`
              )}
            >
              {fw.name}
            </button>
            {isUnsuitable && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-md">
                Not recommended for this query
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
