-- OAuth tables migration for auth_warrspa

CREATE TABLE IF NOT EXISTS tenant_oauth_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider_key VARCHAR(50) NOT NULL,
    issuer TEXT,
    authorization_endpoint TEXT,
    token_endpoint TEXT,
    userinfo_endpoint TEXT,
    jwks_uri TEXT,
    client_id TEXT NOT NULL,
    client_secret_ciphertext TEXT NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile'],
    claim_mapping JSONB DEFAULT '{"subjectPath":"sub"}',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, provider_key)
);

CREATE TABLE IF NOT EXISTS oauth_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES tenant_oauth_connections(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    nonce TEXT,
    code_verifier TEXT,
    redirect_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(state)
);

CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES tenant_oauth_connections(id) ON DELETE CASCADE,
    provider_subject TEXT NOT NULL,
    provider_email TEXT,
    profile JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, connection_id, provider_subject)
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
    access_token_ciphertext TEXT,
    refresh_token_ciphertext TEXT,
    id_token_ciphertext TEXT,
    scope TEXT,
    token_type TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_oauth_connections_tenant_id ON tenant_oauth_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oauth_transactions_state ON oauth_transactions(state);
CREATE INDEX IF NOT EXISTS idx_identities_tenant_id ON identities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_identity_id ON oauth_tokens(identity_id);
