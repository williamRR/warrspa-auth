import { getApp } from '../helpers/test-app';

describe('Tenant Middleware Integration Tests', () => {
  it('should reject request without tenant header', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'GET',
      url: '/auth/test',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'missing_tenant_header',
      message: 'X-Tenant-ID header is required',
    });
  });

  it('should accept request with valid tenant header', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'GET',
      url: '/auth/test',
      headers: {
        'X-Tenant-ID': 'test-tenant',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      message: 'Tenant middleware is working',
      tenantId: 'test-tenant',
    });
  });

  it('should handle different tenant IDs', async () => {
    const app = await getApp();

    const tenantIds = ['tenant-1', 'tenant-2', 'tenant-3'];

    for (const tenantId of tenantIds) {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/test',
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().tenantId).toBe(tenantId);
    }
  });
});
