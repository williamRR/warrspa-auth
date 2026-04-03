"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Key,
  Globe,
  Server,
  Lock,
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg tracking-tight">
                WarrSPA Auth
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            API Documentation
          </h1>
          <p className="text-muted-foreground">
            Complete reference for integrating WarrSPA Auth into your SaaS
          </p>
        </div>

        <div className="space-y-8">
          {/* Quick Start */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Badge variant="secondary">Quick Start</Badge>
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Register a user</CardTitle>
                <CardDescription>
                  Simple email/password registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto bg-code-bg text-code-text p-4 rounded-lg">
                  <code>{`curl -X POST http://api.warrspa.com/saas/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'`}</code>
                </pre>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Authentication */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6" />
              Authentication
            </h2>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">JWT Tokens</CardTitle>
                  <CardDescription>
                    All authenticated endpoints require a Bearer token in the
                    Authorization header.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm overflow-x-auto bg-code-bg text-code-text p-4 rounded-lg">
                    <code>{`Authorization: Bearer <your_jwt_token>`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">API Keys</CardTitle>
                  <CardDescription>
                    For admin operations, use API keys instead of JWTs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm overflow-x-auto bg-code-bg text-code-text p-4 rounded-lg">
                    <code>{`X-API-Key: <your_api_key>`}</code>
                  </pre>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> API keys are tied to your tenant
                      and have full access to admin endpoints. Keep them secure!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Social Login */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Globe className="h-6 w-6" />
              Social Login
            </h2>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Configure OAuth Providers
                </CardTitle>
                <CardDescription>
                  Allow users to sign in with Google, GitHub, Discord, or any
                  OIDC provider.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-3">Supported Providers</h3>
                <ul className="space-y-2 mb-4">
                  {["Google", "GitHub", "Discord"].map((provider) => (
                    <li
                      key={provider}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      {provider}
                    </li>
                  ))}
                </ul>

                <h3 className="font-semibold mb-3">How to get credentials</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Google</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Go to{" "}
                        <a
                          href="https://console.cloud.google.com"
                          target="_blank"
                          rel="noopener"
                          className="text-primary hover:underline"
                        >
                          Google Cloud Console
                        </a>
                      </li>
                      <li>Create a new project or select existing</li>
                      <li>Navigate to APIs & Services → Credentials</li>
                      <li>Create OAuth 2.0 Client ID</li>
                      <li>
                        Set authorized redirect URIs to:{" "}
                        <code className="bg-background px-1 rounded">
                          https://your-domain.com/oauth/callback/[connection-id]
                        </code>
                      </li>
                      <li>Copy Client ID and Client Secret</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">GitHub</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Go to{" "}
                        <a
                          href="https://github.com/settings/developers"
                          target="_blank"
                          rel="noopener"
                          className="text-primary hover:underline"
                        >
                          GitHub Developer Settings
                        </a>
                      </li>
                      <li>Click "New OAuth App"</li>
                      <li>Set Homepage URL and Authorization callback URL</li>
                      <li>Copy Client ID and generate Client Secret</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect a Provider</CardTitle>
                <CardDescription>
                  Use the API to register your OAuth credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto bg-code-bg text-code-text p-4 rounded-lg">
                  <code>{`curl -X POST http://api.warrspa.com/oauth/connections \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key" \\
  -d '{
    "provider_key": "google",
    "client_id": "your-client-id.apps.googleusercontent.com",
    "client_secret": "your-client-secret"
  }'`}</code>
                </pre>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Endpoints Reference */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Server className="h-6 w-6" />
              Endpoints Reference
            </h2>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      POST
                    </Badge>
                    <code className="text-sm">/saas/register</code>
                  </div>
                  <CardDescription>
                    Register a new tenant and user
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      POST
                    </Badge>
                    <code className="text-sm">/saas/login</code>
                  </div>
                  <CardDescription>Login with email/password</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      GET
                    </Badge>
                    <code className="text-sm">/oauth/connections</code>
                  </div>
                  <CardDescription>
                    List connected OAuth providers
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      POST
                    </Badge>
                    <code className="text-sm">/oauth/connections</code>
                  </div>
                  <CardDescription>
                    Register a new OAuth provider
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      GET
                    </Badge>
                    <code className="text-sm">/admin/users</code>
                  </div>
                  <CardDescription>
                    List all users (API key required)
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      GET
                    </Badge>
                    <code className="text-sm">/admin/stats</code>
                  </div>
                  <CardDescription>
                    Get tenant statistics (API key required)
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Multi-tenancy */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <Key className="h-6 w-6" />
              Multi-Tenancy
            </h2>

            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  All requests must include the{" "}
                  <code className="bg-muted px-1 rounded">X-Tenant-ID</code>{" "}
                  header. Each tenant is completely isolated - users from one
                  tenant cannot access data from another.
                </p>
                <pre className="text-sm overflow-x-auto bg-code-bg text-code-text p-4 rounded-lg">
                  <code>{`X-Tenant-ID: your-tenant-id`}</code>
                </pre>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold mb-4">Ready to integrate?</h3>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} WarrSPA Auth. Built for developers.
          </p>
        </div>
      </footer>
    </div>
  );
}
