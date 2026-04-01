import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Auth API E2E Tests', () => {
  const tenantId = 'e2e-test-tenant';

  test.describe('POST /auth/register', () => {
    test('should register a new user', async ({ request }) => {
      const randomEmail = `user-${Date.now()}@example.com`;

      const response = await request.post(`${BASE_URL}/auth/register`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email: randomEmail,
          password: 'SecurePassword123!',
        },
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('refresh_token');
      expect(body.user).toHaveProperty('id');
      expect(body.user).toHaveProperty('email', randomEmail);
      expect(body.user).toHaveProperty('email_verified', false);
    });

    test('should reject duplicate email in same tenant', async ({ request }) => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First registration
      const firstResponse = await request.post(`${BASE_URL}/auth/register`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email,
          password: 'password123',
        },
      });

      expect(firstResponse.status()).toBe(201);

      // Second registration with same email
      const secondResponse = await request.post(`${BASE_URL}/auth/register`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email,
          password: 'different123',
        },
      });

      expect(secondResponse.status()).toBe(409);
      const body = await secondResponse.json();
      expect(body).toHaveProperty('error', 'user_exists');
    });

    test('should validate password length', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/register`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email: `test-${Date.now()}@example.com`,
          password: 'short',
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'validation_error');
    });

    test('should reject missing fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/register`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email: `test-${Date.now()}@example.com`,
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('POST /auth/login', () => {
    let testEmail: string;
    const testPassword = 'LoginTest123!';

    test.beforeEach(async ({ request }) => {
      // Register a user before each login test
      testEmail = `login-user-${Date.now()}@example.com`;
      await request.post(`${BASE_URL}/auth/register`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email: testEmail,
          password: testPassword,
        },
      });
    });

    test('should login with valid credentials', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email: testEmail,
          password: testPassword,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('refresh_token');
      expect(body.user).toHaveProperty('email', testEmail);
    });

    test('should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email: testEmail,
          password: 'wrongpassword',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'invalid_credentials');
    });

    test('should reject non-existent user', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          email: 'nonexistent@example.com',
          password: testPassword,
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /auth/me', () => {
    let accessToken: string;
    let testEmail: string;

    test.beforeEach(async ({ request }) => {
      // Register and get token
      testEmail = `me-user-${Date.now()}@example.com`;
      const registerResponse = await request.post(
        `${BASE_URL}/auth/register`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
          },
          data: {
            email: testEmail,
            password: 'MeTest123!',
          },
        }
      );

      const body = await registerResponse.json();
      accessToken = body.access_token;
    });

    test('should return user data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/auth/me`, {
        headers: {
          'X-Tenant-ID': tenantId,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email', testEmail);
      expect(body).toHaveProperty('email_verified', false);
      expect(body).toHaveProperty('created_at');
      expect(body).toHaveProperty('updated_at');
    });

    test('should reject request without token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/auth/me`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should reject invalid token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/auth/me`, {
        headers: {
          'X-Tenant-ID': tenantId,
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /auth/refresh', () => {
    let refreshToken: string;

    test.beforeEach(async ({ request }) => {
      // Register and get refresh token
      const registerResponse = await request.post(
        `${BASE_URL}/auth/register`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
          },
          data: {
            email: `refresh-${Date.now()}@example.com`,
            password: 'Refresh123!',
          },
        }
      );

      const body = await registerResponse.json();
      refreshToken = body.refresh_token;
    });

    test('should refresh tokens', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/refresh`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          refresh_token: refreshToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('refresh_token');
      expect(body.refresh_token).not.toBe(refreshToken); // Token rotation
    });

    test('should reject invalid refresh token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/refresh`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          refresh_token: 'invalid-refresh-token',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'invalid_refresh_token');
    });

    test('should rotate refresh tokens (old token becomes invalid)', async ({
      request,
    }) => {
      // First refresh
      const firstRefresh = await request.post(`${BASE_URL}/auth/refresh`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          refresh_token: refreshToken,
        },
      });

      expect(firstRefresh.status()).toBe(200);
      const firstBody = await firstRefresh.json();

      // Try to use old token again
      const secondRefresh = await request.post(`${BASE_URL}/auth/refresh`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          refresh_token: refreshToken, // Old token
        },
      });

      expect(secondRefresh.status()).toBe(401);
    });
  });

  test.describe('POST /auth/logout', () => {
    let refreshToken: string;

    test.beforeEach(async ({ request }) => {
      // Register and get refresh token
      const registerResponse = await request.post(
        `${BASE_URL}/auth/register`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
          },
          data: {
            email: `logout-${Date.now()}@example.com`,
            password: 'Logout123!',
          },
        }
      );

      const body = await registerResponse.json();
      refreshToken = body.refresh_token;
    });

    test('should logout successfully', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/logout`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          refresh_token: refreshToken,
        },
      });

      expect(response.status()).toBe(204);
    });

    test('should invalidate refresh token after logout', async ({ request }) => {
      // Logout
      await request.post(`${BASE_URL}/auth/logout`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {
          refresh_token: refreshToken,
        },
      });

      // Try to use the token
      const refreshResponse = await request.post(
        `${BASE_URL}/auth/refresh`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
          },
          data: {
            refresh_token: refreshToken,
          },
        }
      );

      expect(refreshResponse.status()).toBe(401);
    });

    test('should require refresh token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/logout`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
        data: {},
      });

      expect(response.status()).toBe(400);
    });
  });
});
