import { describe, it, expect } from 'vitest';
import type { AgentGeneratedConfig, ResourceConsent } from '../src/apps/agent365.js';
import { toAgentCreateOutput } from '../src/commands/agent/create.js';

const ENV_PATH = '/work/.env';

function grantedConsent(overrides: Partial<ResourceConsent> = {}): ResourceConsent {
  return {
    resourceName: 'Microsoft Graph',
    resourceAppId: '00000003-0000-0000-c000-000000000000',
    consentGranted: true,
    ...overrides,
  };
}

function baseConfig(overrides: Partial<AgentGeneratedConfig> = {}): AgentGeneratedConfig {
  return {
    agentBlueprintId: 'bp-1',
    agentBlueprintObjectId: 'bp-obj-1',
    agentBlueprintServicePrincipalObjectId: 'bp-sp-1',
    resourceConsents: [grantedConsent()],
    completed: true,
    ...overrides,
  };
}

describe('toAgentCreateOutput', () => {
  it('maps a config with all consents granted to status "completed"', () => {
    const output = toAgentCreateOutput(baseConfig(), '/work/a365.generated.config.json', ENV_PATH);

    expect(output).toEqual({
      status: 'completed',
      agentBlueprintId: 'bp-1',
      agentBlueprintObjectId: 'bp-obj-1',
      managedIdentityPrincipalId: 'bp-sp-1',
      generatedConfigPath: '/work/a365.generated.config.json',
      envPath: ENV_PATH,
    });
  });

  it('maps a config with an ungranted resource consent to "pending_admin_consent"', () => {
    const output = toAgentCreateOutput(
      baseConfig({ resourceConsents: [grantedConsent({ consentGranted: false })] }),
      '/work/a365.generated.config.json',
      ENV_PATH
    );

    expect(output.status).toBe('pending_admin_consent');
  });

  it('treats no resource consents as "completed" (nothing pending to report)', () => {
    const output = toAgentCreateOutput(
      baseConfig({ resourceConsents: [] }),
      '/work/a365.generated.config.json',
      ENV_PATH
    );

    expect(output.status).toBe('completed');
  });

  it('is "completed" even when completed is false, as long as all consents are granted', () => {
    // `completed: false` can reflect unrelated setup propagation delays, not
    // admin consent -- a365 itself may already report "Consent granted (All
    // permissions)" in this state.
    const output = toAgentCreateOutput(
      baseConfig({ completed: false }),
      '/work/a365.generated.config.json',
      ENV_PATH
    );

    expect(output.status).toBe('completed');
  });

  it('includes messagingEndpoint when present', () => {
    const output = toAgentCreateOutput(
      baseConfig({ messagingEndpoint: 'https://example.com/api/messages' }),
      '/work/a365.generated.config.json',
      ENV_PATH
    );

    expect(output.messagingEndpoint).toBe('https://example.com/api/messages');
  });

  it('omits messagingEndpoint when absent', () => {
    const output = toAgentCreateOutput(baseConfig(), '/work/a365.generated.config.json', ENV_PATH);

    expect(output.messagingEndpoint).toBeUndefined();
    expect('messagingEndpoint' in output).toBe(false);
  });

  it('includes consentUrl only when pending and present', () => {
    const pending = toAgentCreateOutput(
      baseConfig({
        resourceConsents: [grantedConsent({ consentGranted: false })],
        consentUrl: 'https://consent.example.com',
      }),
      '/work/a365.generated.config.json',
      ENV_PATH
    );
    expect(pending.consentUrl).toBe('https://consent.example.com');

    const completed = toAgentCreateOutput(
      baseConfig({ consentUrl: 'https://consent.example.com' }),
      '/work/a365.generated.config.json',
      ENV_PATH
    );
    expect(completed.consentUrl).toBeUndefined();
  });

  it('always includes envPath', () => {
    const output = toAgentCreateOutput(baseConfig(), '/work/a365.generated.config.json', ENV_PATH);
    expect(output.envPath).toBe(ENV_PATH);
  });

  it('omits secretSkipped by default', () => {
    const output = toAgentCreateOutput(baseConfig(), '/work/a365.generated.config.json', ENV_PATH);
    expect(output.secretSkipped).toBeUndefined();
    expect('secretSkipped' in output).toBe(false);
  });

  it('includes secretSkipped: true when the plaintext secret could not be retrieved', () => {
    const output = toAgentCreateOutput(baseConfig(), '/work/a365.generated.config.json', ENV_PATH, true);
    expect(output.secretSkipped).toBe(true);
  });
});
