import { API_URL } from "./auth";

interface RegisterRequest {
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    email_verified: boolean;
  };
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface CreateApiKeyRequest {
  name: string;
  expires_in_days?: number;
}

interface ApiKeyResponse extends ApiKey {
  key?: string;
}

interface UserInfo {
  user: {
    id: string;
    email: string;
    email_verified: boolean;
    created_at: string;
  };
  tenant: {
    id: string;
    name: string;
    key: string;
    created_at: string;
    allowed_redirect_uris?: string[];
  };
}

interface OAuthProviderConfig {
  client_id: string;
  client_secret: string;
  enabled: boolean;
}

interface OAuthConfigResponse {
  google?: OAuthProviderConfig;
  github?: OAuthProviderConfig;
  discord?: OAuthProviderConfig;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch(
    endpoint: string,
    options: RequestInit = {},
    token?: string,
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // SaaS endpoints - public, no tenant required
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.fetch("/saas/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.fetch("/saas/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMe(token: string): Promise<UserInfo> {
    return this.fetch("/saas/me", {}, token);
  }

  async getApiKeys(token: string): Promise<{ data: ApiKey[] }> {
    return this.fetch("/saas/api-keys", {}, token);
  }

  async createApiKey(
    token: string,
    data: CreateApiKeyRequest,
  ): Promise<ApiKeyResponse> {
    return this.fetch(
      "/saas/api-keys",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token,
    );
  }

  async deleteApiKey(token: string, id: string): Promise<void> {
    return this.fetch(
      `/saas/api-keys/${id}`,
      {
        method: "DELETE",
      },
      token,
    );
  }

  async getStats(token: string): Promise<{
    total_users: number;
    active_sessions: number;
    total_api_keys: number;
  }> {
    return this.fetch("/saas/stats", {}, token);
  }

  async getOAuthConfig(token: string): Promise<OAuthConfigResponse> {
    return this.fetch("/saas/oauth-config", {}, token);
  }

  async configureOAuthProvider(
    token: string,
    provider: string,
    data: { clientId: string; clientSecret: string; enabled: boolean },
  ): Promise<void> {
    return this.fetch(
      `/saas/oauth-config/${provider}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: data.clientId,
          client_secret: data.clientSecret,
          enabled: data.enabled,
        }),
      },
      token,
    );
  }

  async updateTenantSettings(
    token: string,
    data: { name?: string; allowedRedirectUris?: string[] },
  ): Promise<void> {
    return this.fetch(
      "/saas/tenant",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token,
    );
  }
}

export interface CreateTenantRequest {
  name: string;
  key: string;
  allowed_redirect_uris?: string[];
}

export const apiClient = new ApiClient();
export type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ApiKey,
  CreateApiKeyRequest,
  ApiKeyResponse,
  UserInfo,
};
