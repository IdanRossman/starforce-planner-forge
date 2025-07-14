import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your preferences and app settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-16 text-center">
            <SettingsIcon className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              App Configuration
            </h3>
            <p className="text-muted-foreground mb-6">
              Future settings will include:
            </p>
            <ul className="text-left text-muted-foreground space-y-2 max-w-md mx-auto">
              <li>• Theme customization</li>
              <li>• Default calculation preferences</li>
              <li>• Notification settings</li>
              <li>• Data storage preferences</li>
              <li>• Performance optimizations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}