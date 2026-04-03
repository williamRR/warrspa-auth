"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function OAuthPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Google config state
  const [googleConfig, setGoogleConfig] = useState({
    clientId: "",
    clientSecret: "",
    enabled: false,
  });

  useEffect(() => {
    if (accessToken) {
      loadConfig();
    }
  }, [accessToken]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const config = await apiClient.getOAuthConfig(accessToken!);
      if (config.google) {
        setGoogleConfig({
          clientId: config.google.client_id || "",
          clientSecret: config.google.client_secret || "",
          enabled: config.google.enabled || false,
        });
      }
    } catch (error) {
      console.error("Failed to load OAuth config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoogle = async () => {
    try {
      setSaving(true);
      await apiClient.configureOAuthProvider(
        accessToken!,
        "google",
        googleConfig,
      );
      alert("Google OAuth configuration saved successfully");
    } catch (error) {
      console.error("Failed to save Google OAuth config:", error);
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">OAuth Providers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Google Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Google</CardTitle>
              <Badge variant={googleConfig.enabled ? "default" : "secondary"}>
                {googleConfig.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <CardDescription>
              Configure Google OAuth for your tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-client-id">Client ID</Label>
              <Input
                id="google-client-id"
                value={googleConfig.clientId}
                onChange={(e) =>
                  setGoogleConfig({ ...googleConfig, clientId: e.target.value })
                }
                placeholder="Enter Google Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-client-secret">Client Secret</Label>
              <Input
                id="google-client-secret"
                type="password"
                value={googleConfig.clientSecret}
                onChange={(e) =>
                  setGoogleConfig({
                    ...googleConfig,
                    clientSecret: e.target.value,
                  })
                }
                placeholder="Enter Google Client Secret"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setGoogleConfig({
                    ...googleConfig,
                    enabled: !googleConfig.enabled,
                  })
                }
              >
                {googleConfig.enabled ? "Disable" : "Enable"} Provider
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleSaveGoogle}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </CardFooter>
        </Card>

        {/* GitHub Card (Coming Soon) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>GitHub</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <CardDescription>
              Configure GitHub OAuth for your tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-client-id">Client ID</Label>
              <Input
                id="github-client-id"
                disabled
                placeholder="Coming soon..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github-client-secret">Client Secret</Label>
              <Input
                id="github-client-secret"
                type="password"
                disabled
                placeholder="Coming soon..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardFooter>
        </Card>

        {/* Discord Card (Coming Soon) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Discord</CardTitle>
              <Badge variant="outline">Coming soon</Badge>
            </div>
            <CardDescription>
              Configure Discord OAuth for your tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discord-client-id">Client ID</Label>
              <Input
                id="discord-client-id"
                disabled
                placeholder="Coming soon..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord-client-secret">Client Secret</Label>
              <Input
                id="discord-client-secret"
                type="password"
                disabled
                placeholder="Coming soon..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
