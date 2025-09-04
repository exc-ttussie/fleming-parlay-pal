import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState, ErrorState } from "@/components/ui/loading-state";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Database, Users, Bell, Shield, RefreshCw } from "lucide-react";

interface SystemSettings {
  oddsApiEnabled: boolean;
  autoApprovalEnabled: boolean;
  notificationsEnabled: boolean;
  maxLegsPerUser: number;
  defaultStakeAmount: number;
  lockTimeHoursBefore: number;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    oddsApiEnabled: true,
    autoApprovalEnabled: false,
    notificationsEnabled: true,
    maxLegsPerUser: 1,
    defaultStakeAmount: 1000,
    lockTimeHoursBefore: 2
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // In a real app, you'd save to a settings table
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const refreshOdds = async () => {
    setLoading(true);
    try {
      // Trigger odds refresh
      const { error } = await supabase.functions.invoke('fetch-odds');
      if (error) throw error;
      toast.success("Odds refresh initiated");
    } catch (error) {
      toast.error("Failed to refresh odds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
        {hasChanges && (
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data & API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
              <CardDescription>Configure gameplay parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultStake">Default Stake Amount ($)</Label>
                  <Input
                    id="defaultStake"
                    type="number"
                    value={settings.defaultStakeAmount / 100}
                    onChange={(e) => handleSettingChange('defaultStakeAmount', parseInt(e.target.value) * 100)}
                    min="1"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLegs">Max Legs Per User</Label>
                  <Input
                    id="maxLegs"
                    type="number"
                    value={settings.maxLegsPerUser}
                    onChange={(e) => handleSettingChange('maxLegsPerUser', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lockTime">Lock Time (hours before)</Label>
                  <Input
                    id="lockTime"
                    type="number"
                    value={settings.lockTimeHoursBefore}
                    onChange={(e) => handleSettingChange('lockTimeHoursBefore', parseInt(e.target.value))}
                    min="0"
                    max="72"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Configure user permissions and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approval for trusted users</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve legs from users with good history
                  </p>
                </div>
                <Switch
                  checked={settings.autoApprovalEnabled}
                  onCheckedChange={(checked) => handleSettingChange('autoApprovalEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications for important events
                  </p>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data & API Settings</CardTitle>
              <CardDescription>Manage external data sources and API connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Odds API Integration</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic odds fetching from external API
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={settings.oddsApiEnabled ? "default" : "secondary"}>
                    {settings.oddsApiEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={settings.oddsApiEnabled}
                    onCheckedChange={(checked) => handleSettingChange('oddsApiEnabled', checked)}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={refreshOdds} 
                  disabled={loading || !settings.oddsApiEnabled}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Odds Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}