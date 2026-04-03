"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient, type ApiKey } from "@/lib/api";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ExpiresOption = "30" | "90" | "365" | "never";

export default function ApiKeysPage() {
  const { user, accessToken, isLoading } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpires, setNewKeyExpires] = useState<ExpiresOption>("30");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState<ApiKey | null>(null);
  const [newKeyValue, setNewKeyValue] = useState<string>("");
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [error, setError] = useState("");
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  useEffect(() => {
    if (accessToken) {
      loadApiKeys();
    }
  }, [accessToken]);

  const loadApiKeys = async () => {
    if (!accessToken) return;
    setIsLoadingKeys(true);
    setError("");
    try {
      const response = await apiClient.getApiKeys(accessToken);
      setApiKeys(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to load API keys");
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleCreateKey = async () => {
    if (!accessToken || !newKeyName.trim()) return;
    setIsCreatingKey(true);
    setError("");
    try {
      const expiresDays =
        newKeyExpires === "never" ? undefined : parseInt(newKeyExpires);
      const response = await apiClient.createApiKey(accessToken, {
        name: newKeyName.trim(),
        expires_in_days: expiresDays,
      });
      setNewKeyValue(response.key || "");
      setShowNewKey(response);
      setNewKeyName("");
      setNewKeyExpires("30");
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || "Failed to create API key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!accessToken || !keyToRevoke) return;
    try {
      await apiClient.deleteApiKey(accessToken, keyToRevoke.id);
      setKeyToRevoke(null);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || "Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString() : "Never";

  const getExpiresLabel = (option: ExpiresOption): string => {
    switch (option) {
      case "30":
        return "30 days";
      case "90":
        return "90 days";
      case "365":
        return "1 year";
      case "never":
        return "Never";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for accessing admin endpoints
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create API Key */}
        <Card>
          <CardHeader>
            <CardTitle>Create API Key</CardTitle>
            <CardDescription>
              Generate a key to access admin endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresIn">Expiration</Label>
              <select
                id="expiresIn"
                value={newKeyExpires}
                onChange={(e) =>
                  setNewKeyExpires(e.target.value as ExpiresOption)
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="never">Never</option>
              </select>
            </div>
            <Button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim() || isCreatingKey}
            >
              {isCreatingKey ? "Creating..." : "Generate API Key"}
            </Button>
          </CardContent>
        </Card>

        {/* New Key Dialog */}
        <Dialog
          open={!!showNewKey}
          onOpenChange={(open) => {
            if (!open) {
              setShowNewKey(null);
              setNewKeyValue("");
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy this key now — you won&apos;t see it again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <span className="text-sm font-medium">
                    {showNewKey?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    Expires
                  </Label>
                  <span className="text-sm">
                    {showNewKey?.expires_at
                      ? formatDate(showNewKey.expires_at)
                      : "Never"}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm break-all">{newKeyValue}</code>
              </div>
              <Button
                onClick={() => newKeyValue && copyToClipboard(newKeyValue)}
                className="w-full"
              >
                Copy to Clipboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revoke Confirmation Dialog */}
        <Dialog
          open={!!keyToRevoke}
          onOpenChange={(open) => !open && setKeyToRevoke(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke API Key</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke &quot;{keyToRevoke?.name}&quot;?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setKeyToRevoke(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRevokeKey}>
                Revoke
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              {apiKeys.length} key{apiKeys.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingKeys ? (
              <p className="text-muted-foreground text-center py-8">
                Loading...
              </p>
            ) : apiKeys.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No API keys yet. Create your first key above.
              </p>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant="outline">{key.prefix}...</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-x-3">
                        <span>Created: {formatDate(key.created_at)}</span>
                        <span>•</span>
                        <span>Last used: {formatDate(key.last_used_at)}</span>
                        {key.expires_at && (
                          <>
                            <span>•</span>
                            <span>Expires: {formatDate(key.expires_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setKeyToRevoke(key)}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
