"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TenantInfo {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  active_sessions: number;
  total_api_keys: number;
}

export default function OverviewPage() {
  const { accessToken } = useAuth();
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const loadData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [meResponse, statsResponse] = await Promise.all([
        apiClient.getMe(accessToken),
        apiClient.getStats(accessToken),
      ]);
      setTenantInfo(meResponse.tenant);
      setStats(statsResponse);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>Your tenant details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tenant Name</p>
              <p className="font-medium">{tenantInfo?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Tenant ID</p>
              <code className="text-xs bg-muted p-1.5 rounded block mt-1">
                {tenantInfo?.id || "Loading..."}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => tenantInfo?.id && copyToClipboard(tenantInfo.id)}
              disabled={!tenantInfo?.id}
            >
              {copyFeedback ? "Copiado!" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.active_sessions ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_api_keys ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
          <CardDescription>
            Get started with the Auth API in 3 steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <Badge
                variant="default"
                className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0"
              >
                1
              </Badge>
              <div>
                <p className="font-medium">Copy your Tenant ID</p>
                <p className="text-sm text-muted-foreground">
                  Use the copy button above to get your unique tenant identifier
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge
                variant="default"
                className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0"
              >
                2
              </Badge>
              <div>
                <p className="font-medium">Go to API Keys and generate a key</p>
                <p className="text-sm text-muted-foreground">
                  Create an API key in the Dashboard to authenticate your
                  requests
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge
                variant="default"
                className="h-6 w-6 rounded-full p-0 flex items-center justify-center flex-shrink-0"
              >
                3
              </Badge>
              <div>
                <p className="font-medium">Use them in your requests</p>
                <p className="text-sm text-muted-foreground">
                  Include{" "}
                  <code className="bg-muted px-1 rounded">X-Tenant-ID</code> and{" "}
                  <code className="bg-muted px-1 rounded">X-Api-Key</code>{" "}
                  headers in every API call
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
