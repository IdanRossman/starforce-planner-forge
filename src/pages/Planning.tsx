import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

export default function Planning() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Planning</h1>
        <p className="text-muted-foreground">
          Advanced planning tools and strategies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-16 text-center">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Advanced Planning Tools
            </h3>
            <p className="text-muted-foreground mb-6">
              Future features will include:
            </p>
            <ul className="text-left text-muted-foreground space-y-2 max-w-md mx-auto">
              <li>• Event optimization recommendations</li>
              <li>• Bulk planning across characters</li>
              <li>• Cost analysis and budgeting</li>
              <li>• Timeline planning</li>
              <li>• Equipment priority suggestions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}