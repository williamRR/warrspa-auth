import { PactOptions } from '@pact-foundation/pact';

export const pactConfig: PactOptions = {
  consumer: 'auth-platform-api',
  provider: 'auth-platform-client',
  spec: 2,
  dir: './tests/contract/pacts',
  logLevel: 'info',
  log: './tests/contract/logs',
};

export const pactServerOptions = {
  port: 9123,
  host: '127.0.0.1',
};
