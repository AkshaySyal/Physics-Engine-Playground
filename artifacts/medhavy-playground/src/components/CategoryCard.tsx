import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { FRAMEWORKS } from "./FrameworkSelector";

export interface CategoryCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  examples: string[];
  exampleImages?: (string | null)[];
  recommended: string[];
  onSelectQuery: (query: string, imageUrl?: string) => void;
}

export function CategoryCard({
  id,
  title,
  description,
  icon: Icon,
  examples,
  exampleImages,
  recommended,
  onSelectQuery,
}: CategoryCardProps) {
  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors" data-testid={`category-card-${id}`}>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {recommended.map((rec) => {
            const fw = FRAMEWORKS.find((f) => f.name === rec);
            return (
              <Badge
                key={rec}
                variant="outline"
                className={fw ? `${fw.text} ${fw.border}` : ""}
              >
                {rec}
              </Badge>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Example Queries</p>
          <div className="space-y-2">
            {examples.map((ex, i) => {
              const imgUrl = exampleImages?.[i] ?? null;
              return (
                <button
                  key={i}
                  onClick={() => onSelectQuery(ex, imgUrl ?? undefined)}
                  className="w-full text-left text-sm text-foreground/80 hover:text-primary bg-muted/30 hover:bg-muted/60 p-2 rounded-md transition-colors"
                >
                  {imgUrl ? (
                    <div className="flex items-start gap-2">
                      <img
                        src={imgUrl}
                        alt={`Example ${i + 1}`}
                        className="w-12 h-10 object-cover rounded shrink-0 border border-border/40"
                      />
                      <span>"{ex}"</span>
                    </div>
                  ) : (
                    <span>"{ex}"</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
