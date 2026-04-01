import { getApp } from '../helpers/test-app';

describe('Health Endpoint Integration Tests', () => {
  it('should return health status without tenant header', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
    });
    expect(response.json()).toHaveProperty('timestamp');
  });

  it('should return health status with tenant header', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'X-Tenant-ID': 'test-tenant',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
    });
  });

  it('should return valid timestamp', async () => {
    const app = await getApp();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    const body = response.json();
    expect(() => new Date(body.timestamp)).not.toThrow();
  });
});
