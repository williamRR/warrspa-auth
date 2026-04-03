"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Key,
  Users,
  BarChart3,
  Check,
  ArrowRight,
  Zap,
  Lock,
  Globe,
  Copy,
  CheckCheck,
} from "lucide-react";

export default function LandingPage() {
  const [copied, setCopied] = useState(false);
  const currentYear = new Date().getFullYear();

  const curlCode = `curl -X POST http://api.warrspa.com/saas/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'`;

  const jsCode = `// 1. Register a new user
const res = await fetch('/saas/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'secure123'
  })
});

const { access_token, user } = await res.json();

// 2. Create an API key
const keyRes = await fetch('/saas/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${access_token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Production' })
});

const { key } = await keyRes.json();
// Save this key - it won't be shown again!`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg tracking-tight">
                WarrSPA Auth
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="#features"
                className="text-sm text-nav-text hover:text-foreground transition-colors hidden sm:block"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-nav-text hover:text-foreground transition-colors hidden sm:block"
              >
                Pricing
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Multi-tenant Auth API
            </Badge>
            <h1 className="text-[56px] md:text-6xl font-bold tracking-tight mb-4 leading-tight">
              Authentication infrastructure{" "}
              <span className="text-primary">for your SaaS</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Complete auth service with multi-tenancy, API key management, and
              user analytics. One integration, infinite tenants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto btn-primary">
                  Start Building Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Code Preview */}
          <div className="mt-12 max-w-2xl mx-auto">
            <Card className="border-2 overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-2">Register a user</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(curlCode)}
                  aria-label="Copy code"
                  className="h-8"
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto bg-code-bg text-code-text p-4 rounded-lg">
                  <code className="language-bash">{curlCode}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need for auth
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for SaaS founders who need robust authentication without the
              complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-md transition-all duration-200 feature-card cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Multi-Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Each user gets their own isolated tenant. Data never mixes
                  between customers.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-200 feature-card cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">API Key Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate, revoke, and track API keys. Your users manage their
                  own access.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-200 feature-card cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">JWT Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Secure JWT tokens with automatic refresh. Access tokens expire
                  in 15 minutes.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-200 feature-card cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track active sessions, user growth, and API usage per tenant.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-200 feature-card cursor-pointer">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Security First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  bcrypt password hashing, rate limiting, and audit logs for
                  every action.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-200 feature-card cursor-pointer border-dashed">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-muted/80 transition-colors">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">REST API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Simple REST endpoints. No SDK needed. Works with any stack.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Integration Example */}
      <section className="py-20 md:py-32 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Drop-in authentication
              </h2>
              <p className="text-muted-foreground mb-6">
                Start authenticating users in minutes. No complex setup, no
                dependencies.
              </p>
              <ul className="space-y-3">
                {[
                  "Register users with email/password",
                  "Automatic tenant isolation",
                  "Issue API keys for service access",
                  "Monitor usage and sessions",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-background overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <pre className="text-sm overflow-x-auto bg-code-bg text-code-text p-6 max-h-[400px]">
                    <code className="language-javascript">{jsCode}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <Card className="border-2">
              <CardHeader className="text-center">
                <Badge variant="secondary" className="w-fit mx-auto mb-4">
                  Free during beta
                </Badge>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {[
                    "Unlimited tenants",
                    "1,000 active users",
                    "10,000 API requests/month",
                    "API key management",
                    "JWT authentication",
                    "Email support",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="block">
                  <Button className="w-full" size="lg" variant="outline">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-primary relative overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {[
                    "Unlimited tenants",
                    "10,000 active users",
                    "500,000 API requests/month",
                    "API key management",
                    "JWT authentication",
                    "Priority support",
                    "Advanced analytics",
                    "Custom domains",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="block">
                  <Button className="w-full" size="lg">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to stop building auth?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Focus on your product. We&apos;ll handle the authentication,
            tenants, and API keys.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="btn-primary">
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  WarrSPA Auth
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/auth/login"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/docs"
                className="hover:text-foreground transition-colors"
              >
                API Docs
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/warrspa/auth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              © {currentYear} WarrSPA. Built for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
