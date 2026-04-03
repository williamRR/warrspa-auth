"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { accessToken } = useAuth();
  const [tenantName, setTenantName] = useState("");
  const [allowedRedirectUris, setAllowedRedirectUris] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (accessToken) {
      apiClient
        .getMe(accessToken)
        .then((data) => {
          setTenantName(data.tenant.name);
          setAllowedRedirectUris(
            data.tenant.allowed_redirect_uris?.join("\n") ?? "",
          );
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [accessToken]);

  const handleSaveName = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      await apiClient.updateTenantSettings(accessToken, { name: tenantName });
    } catch (error) {
      console.error("Failed to update tenant name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUris = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const uris = allowedRedirectUris
        .split("\n")
        .map((uri) => uri.trim())
        .filter((uri) => uri.length > 0);
      await apiClient.updateTenantSettings(accessToken, {
        allowedRedirectUris: uris,
      });
    } catch (error) {
      console.error("Failed to update redirect URIs:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-medium">Settings</h1>
        <p className="text-muted-foreground">Manage your tenant settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Name</CardTitle>
          <CardDescription>The display name for your tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Name</Label>
            <Input
              id="tenant-name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              disabled={isLoading || isSaving}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveName}
              disabled={isLoading || isSaving || !tenantName.trim()}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allowed Redirect URIs</CardTitle>
          <CardDescription>
            Enter one redirect URI per line for OAuth callbacks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="redirect-uris">Redirect URIs</Label>
            <textarea
              id="redirect-uris"
              value={allowedRedirectUris}
              onChange={(e) => setAllowedRedirectUris(e.target.value)}
              disabled={isLoading || isSaving}
              className="flex min-h-[120px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://example.com/callback&#10;https://app.example.com/auth/callback"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveUris} disabled={isLoading || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
