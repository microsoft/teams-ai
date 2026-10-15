import { describe, it, expect } from 'vitest';
import type { AgentGeneratedConfig } from '../src/apps/agent365.js';
import { toAgentCreateOutput } from '../src/commands/agent/create.js';

function baseConfig(overrides: Partial<AgentGeneratedConfig> = {}): AgentGeneratedConfig {
  return {
    managedIdentityPrincipalId: 'mi-1',
    agentBlueprintId: 'bp-1',
    agentBlueprintObjectId: 'bp-obj-1',
    agentBlueprintServicePrincipalObjectId: 'bp-sp-1',
    resourceConsents: ['Microsoft Graph'],
    completed: true,
    ...overrides,
  };
}

describe('toAgentCreateOutput', () => {
  it('maps a completed config to status "completed"', () => {
    const output = toAgentCreateOutput(baseConfig(), '/work/a365.generated.config.json');

    expect(output).toEqual({
      status: 'completed',
      agentBlueprintId: 'bp-1',
      agentBlueprintObjectId: 'bp-obj-1',
      managedIdentityPrincipalId: 'mi-1',
      generatedConfigPath: '/work/a365.generated.config.json',
    });
  });

  it('maps an incomplete config (completed: false) to "pending_admin_consent"', () => {
    const output = toAgentCreateOutput(
      baseConfig({ completed: false, resourceConsents: [] }),
      '/work/a365.generated.config.json'
    );

    expect(output.status).toBe('pending_admin_consent');
  });

  it('maps a completed config with no resource consents to "pending_admin_consent"', () => {
    const output = toAgentCreateOutput(
      baseConfig({ completed: true, resourceConsents: [] }),
      '/work/a365.generated.config.json'
    );

    expect(output.status).toBe('pending_admin_consent');
  });

  it('includes messagingEndpoint when present', () => {
    const output = toAgentCreateOutput(
      baseConfig({ messagingEndpoint: 'https://example.com/api/messages' }),
      '/work/a365.generated.config.json'
    );

    expect(output.messagingEndpoint).toBe('https://example.com/api/messages');
  });

  it('omits messagingEndpoint when absent', () => {
    const output = toAgentCreateOutput(baseConfig(), '/work/a365.generated.config.json');

    expect(output.messagingEndpoint).toBeUndefined();
    expect('messagingEndpoint' in output).toBe(false);
  });

  it('includes consentUrl only when pending and present', () => {
    const pending = toAgentCreateOutput(
      baseConfig({ completed: false, resourceConsents: [], consentUrl: 'https://consent.example.com' }),
      '/work/a365.generated.config.json'
    );
    expect(pending.consentUrl).toBe('https://consent.example.com');

    const completed = toAgentCreateOutput(
      baseConfig({ consentUrl: 'https://consent.example.com' }),
      '/work/a365.generated.config.json'
    );
    expect(completed.consentUrl).toBeUndefined();
  });
});
