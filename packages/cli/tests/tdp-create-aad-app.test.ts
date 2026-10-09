import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface RecordedCall {
  url: string;
  method: string;
  body: unknown;
}

const calls: RecordedCall[] = [];
let nextResponse: (() => Response) | undefined;

vi.mock('../src/utils/http.js', () => ({
  apiFetch: vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    if (nextResponse) return nextResponse();
    return new Response(
      JSON.stringify({ id: 'obj-id', appId: 'client-id', displayName: 'My Bot' }),
      {
        status: 201,
      }
    );
  }),
}));

async function loadWithOrbit(orbitBaseUrl: string | undefined) {
  vi.doMock('../src/utils/tdp-host.js', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../src/utils/tdp-host.js')>()),
    TDP_BASE_URL: 'https://tdp.test/api',
    ORBIT_BASE_URL: orbitBaseUrl,
  }));
  return import('../src/apps/tdp.js');
}

describe('createAadAppViaTdp', () => {
  beforeEach(() => {
    calls.length = 0;
    nextResponse = undefined;
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('../src/utils/tdp-host.js');
    vi.resetModules();
  });

  it('uses Orbit v1.0/aadapplications when available', async () => {
    const { createAadAppViaTdp } = await loadWithOrbit('https://orbit.test');

    const app = await createAadAppViaTdp('t', 'My Bot', {
      serviceManagementReference: undefined,
      signInAudience: 'AzureADMultipleOrgs',
    });

    expect(app).toEqual({ id: 'obj-id', appId: 'client-id', displayName: 'My Bot' });
    expect(calls).toEqual([
      {
        url: 'https://orbit.test/v1.0/aadapplications',
        method: 'POST',
        body: { displayName: 'My Bot', signInAudience: 'AzureADMultipleOrgs' },
      },
    ]);
  });

  it('falls back to legacy aadapp/v2 when a serviceManagementReference is set', async () => {
    const { createAadAppViaTdp } = await loadWithOrbit('https://orbit.test');

    await createAadAppViaTdp('t', 'My Bot', {
      serviceManagementReference: 'smr-id',
      signInAudience: 'AzureADMultipleOrgs',
    });

    expect(calls).toEqual([
      {
        url: 'https://tdp.test/api/aadapp/v2',
        method: 'POST',
        body: {
          displayName: 'My Bot',
          signInAudience: 'AzureADMultipleOrgs',
          serviceManagementReference: 'smr-id',
        },
      },
    ]);
  });

  it('uses legacy aadapp/v2 when Orbit is unavailable', async () => {
    const { createAadAppViaTdp } = await loadWithOrbit(undefined);

    await createAadAppViaTdp('t', 'My Bot', {
      serviceManagementReference: undefined,
      signInAudience: 'AzureADMultipleOrgs',
    });

    expect(calls.map((c) => c.url)).toEqual(['https://tdp.test/api/aadapp/v2']);
  });

  it('maps Orbit Graph error body into a CliError', async () => {
    const { createAadAppViaTdp } = await loadWithOrbit('https://orbit.test');
    nextResponse = () =>
      new Response(JSON.stringify({ errorCode: 'Request_BadRequest', errorMessage: 'Bad name' }), {
        status: 400,
      });

    await expect(
      createAadAppViaTdp('t', 'My Bot', {
        serviceManagementReference: undefined,
        signInAudience: 'AzureADMultipleOrgs',
      })
    ).rejects.toMatchObject({
      name: 'CliError',
      code: 'API_ERROR',
      statusCode: 400,
      message: 'Failed to create AAD app: 400 Request_BadRequest: Bad name',
    });
  });

  it('adds a permission hint for an empty Orbit 403', async () => {
    const { createAadAppViaTdp } = await loadWithOrbit('https://orbit.test');
    nextResponse = () => new Response('', { status: 403 });

    await expect(
      createAadAppViaTdp('t', 'My Bot', {
        serviceManagementReference: undefined,
        signInAudience: 'AzureADMultipleOrgs',
      })
    ).rejects.toMatchObject({
      code: 'API_ERROR',
      statusCode: 403,
      message: 'Failed to create AAD app: 403',
      suggestion: expect.stringContaining('not be permitted'),
    });
  });
});
