import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Import, Upload } from "lucide-react";

export default function ImportExport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Import/Export</h1>
        <p className="text-muted-foreground">
          Manage your data import and export
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Import className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-16 text-center">
            <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Data Management Tools
            </h3>
            <p className="text-muted-foreground mb-6">
              Future features will include:
            </p>
            <ul className="text-left text-muted-foreground space-y-2 max-w-md mx-auto">
              <li>• Import from various game trackers</li>
              <li>• Export to different formats</li>
              <li>• Backup and restore functionality</li>
              <li>• Sharing configurations</li>
              <li>• Bulk data operations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}