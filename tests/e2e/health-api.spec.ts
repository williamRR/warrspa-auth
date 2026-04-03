import { test, expect } from "@playwright/test";

test.describe("Health API E2E Tests", () => {
  test("should return healthy status", async ({ request }) => {
    const response = await request.get("/health");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("timestamp");
  });

  test("should return valid ISO timestamp", async ({ request }) => {
    const response = await request.get("/health");
    const body = await response.json();

    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  test("should respond quickly", async ({ request }) => {
    const startTime = Date.now();
    await request.get("/health");
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // Should respond in < 1s
  });
});
