import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { QueryIntent } from "@workspace/api-client-react";
import { FRAMEWORKS } from "./FrameworkSelector";

interface ClassificationPanelProps {
  intent: QueryIntent;
}

export function ClassificationPanel({ intent }: ClassificationPanelProps) {
  return (
    <Card className="bg-muted/20 border-border/50">
      <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Intent</span>
            <Badge variant="secondary" className="font-mono bg-primary/20 text-primary hover:bg-primary/30">
              {intent.query_intent}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {intent.physics_concept}
            </Badge>
            <Badge variant="outline" className="font-mono border-dashed">
              {intent.visual_type}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Recommended</span>
            {intent.recommended_frameworks.map((rec) => {
              const fw = FRAMEWORKS.find((f) => f.id === rec || f.name === rec);
              return (
                <Badge
                  key={rec}
                  variant="outline"
                  className={fw ? `${fw.text} ${fw.border}/50` : ""}
                >
                  {fw ? fw.name : rec}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex md:flex-col gap-4 md:gap-2">
          <div className="flex items-center gap-2 text-sm">
            {intent.requires_animation ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={intent.requires_animation ? "text-foreground" : "text-muted-foreground"}>
              Animation Required
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {intent.requires_numeric_data ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={intent.requires_numeric_data ? "text-foreground" : "text-muted-foreground"}>
              Numeric Data
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
