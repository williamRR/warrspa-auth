export type OAuthProviderKind =
  | "google"
  | "github"
  | "discord"
  | "oidc"
  | "oauth2";

export interface TenantOAuthConnection {
  id: string;
  tenant_id: string;
  provider_key: OAuthProviderKind;
  issuer: string | null;
  authorization_endpoint: string | null;
  token_endpoint: string | null;
  userinfo_endpoint: string | null;
  jwks_uri: string | null;
  client_id: string;
  client_secret_ciphertext: string;
  scopes: string[];
  enabled: boolean;
  claim_mapping: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

export interface Identity {
  id: string;
  user_id: string;
  tenant_id: string;
  connection_id: string;
  provider_subject: string;
  provider_email: string | null;
  profile: Record<string, any>;
  created_at: Date;
}

export interface OAuthToken {
  id: string;
  identity_id: string;
  access_token_ciphertext: string | null;
  refresh_token_ciphertext: string | null;
  id_token_ciphertext: string | null;
  scope: string | null;
  token_type: string | null;
  expires_at: Date | null;
  refresh_token_version: number;
  last_refresh_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthTransaction {
  id: string;
  connection_id: string;
  tenant_id: string;
  state: string;
  nonce: string | null;
  code_verifier: string | null;
  redirect_uri: string;
  expires_at: Date;
  created_at: Date;
}

export interface ProfileMapping {
  subjectPath: string;
  emailPath?: string;
  emailVerifiedPath?: string;
  namePath?: string;
  avatarPath?: string;
}

export interface ProviderConfig {
  id: string;
  tenantId: string;
  kind: OAuthProviderKind;
  issuer?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  profileMapping: ProfileMapping;
}

export interface OAuthBeginResult {
  redirectUrl: string;
  transactionId: string;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}
