import { test, expect } from '@playwright/test';

test.describe('Tenant Middleware E2E Tests', () => {
  test('should reject request without tenant header', async ({ request }) => {
    const response = await request.get('/auth/test');

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toMatchObject({
      error: 'missing_tenant_header',
      message: 'X-Tenant-ID header is required',
    });
  });

  test('should accept request with tenant header', async ({ request }) => {
    const response = await request.get('/auth/test', {
      headers: {
        'X-Tenant-ID': 'e2e-test-tenant',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      message: 'Tenant middleware is working',
      tenantId: 'e2e-test-tenant',
    });
  });

  test('should isolate tenants', async ({ request }) => {
    const tenant1 = 'tenant-1';
    const tenant2 = 'tenant-2';

    const response1 = await request.get('/auth/test', {
      headers: {
        'X-Tenant-ID': tenant1,
      },
    });

    const response2 = await request.get('/auth/test', {
      headers: {
        'X-Tenant-ID': tenant2,
      },
    });

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const body1 = await response1.json();
    const body2 = await response2.json();

    expect(body1.tenantId).toBe(tenant1);
    expect(body2.tenantId).toBe(tenant2);
    expect(body1.tenantId).not.toBe(body2.tenantId);
  });
});
