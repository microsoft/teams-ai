import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CliError } from '../src/utils/errors.js';

const mockExecFile = vi.fn();
const mockSpawn = vi.fn();

vi.mock('node:child_process', () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  assertManifestPublished,
  buildDeveloperPortalConfigUrl,
  ensureGitignoreEntries,
  getGeneratedConfigPath,
  getManifestPaths,
  installA365Cli,
  isA365CliInstalled,
  isDotnetInstalled,
  extractBlueprintSecret,
  extractRegisteredMessagingEndpoint,
  readGeneratedConfig,
  runA365Cleanup,
  runA365Publish,
  runA365SetupAll,
  runA365ShowSecret,
  runA365UpdateEndpoint,
} from '../src/apps/agent365.js';

// Our mocked execFile has no `util.promisify.custom` symbol, so
// `promisify(execFile)` falls back to the default behavior: it calls the
// mock with exactly the args the caller passed, plus one trailing callback.
// Callers here only ever pass (cmd, args), so the mock receives
// (cmd, args, callback).
function mockExecFileSuccess() {
  mockExecFile.mockImplementation((_cmd, _args, callback) => {
    callback(null, { stdout: '', stderr: '' });
  });
}

function mockExecFileFailure(message = 'not found') {
  mockExecFile.mockImplementation((_cmd, _args, callback) => {
    callback(new Error(message));
  });
}

describe('isDotnetInstalled', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when dotnet --version succeeds', async () => {
    mockExecFileSuccess();
    await expect(isDotnetInstalled()).resolves.toBe(true);
  });

  it('returns false when dotnet is not found', async () => {
    mockExecFileFailure();
    await expect(isDotnetInstalled()).resolves.toBe(false);
  });
});

describe('isA365CliInstalled', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when a365 --version succeeds', async () => {
    mockExecFileSuccess();
    await expect(isA365CliInstalled()).resolves.toBe(true);
  });

  it('returns false when a365 is not found', async () => {
    mockExecFileFailure();
    await expect(isA365CliInstalled()).resolves.toBe(false);
  });
});

describe('installA365Cli', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves when dotnet tool install succeeds', async () => {
    mockExecFileSuccess();
    await expect(installA365Cli()).resolves.toBeUndefined();
  });

  it('throws CliError with AGENT_365_CLI_INSTALL_FAILED on failure', async () => {
    mockExecFileFailure('network error');

    await expect(installA365Cli()).rejects.toThrow(CliError);
    try {
      await installA365Cli();
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_365_CLI_INSTALL_FAILED');
      expect(cliError.message).toContain('network error');
      expect(cliError.suggestion).toContain('dotnet tool install');
    }
  });
});

interface FakeChildProcess {
  stdout: { on: ReturnType<typeof vi.fn> };
  stderr: { on: ReturnType<typeof vi.fn> };
  on: ReturnType<typeof vi.fn>;
}

function createFakeChild(): FakeChildProcess {
  return {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
  };
}

describe('runA365SetupAll', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves when the process exits with code 0, always passing --aiteammate', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365SetupAll({ agentName: 'my-agent', cwd: '/work' });

    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await expect(promise).resolves.toBeUndefined();
    expect(mockSpawn).toHaveBeenCalledWith(
      'a365',
      ['setup', 'all', '--agent-name', 'my-agent', '--aiteammate'],
      { cwd: '/work', stdio: ['inherit', 'pipe', 'pipe'] }
    );
  });

  it('rejects with CliError AGENT_SETUP_FAILED on non-zero exit', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365SetupAll({ agentName: 'my-agent', cwd: '/work' });

    const stderrHandler = child.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stderrHandler?.(Buffer.from('boom'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(1);

    await expect(promise).rejects.toThrow(CliError);
    try {
      await promise;
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_SETUP_FAILED');
      expect(cliError.suggestion).toContain('boom');
    }
  });

  it('rejects with CliError AGENT_SETUP_FAILED when the process errors', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365SetupAll({ agentName: 'my-agent', cwd: '/work' });
    const errorHandler = child.on.mock.calls.find(([event]) => event === 'error')?.[1];
    errorHandler?.(new Error('spawn failed'));

    await expect(promise).rejects.toThrow(CliError);
  });

  it('streams raw stdout via onOutput, tagged by stream', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);
    const onOutput = vi.fn();

    const promise = runA365SetupAll({ agentName: 'my-agent', cwd: '/work', onOutput });

    const stdoutHandler = child.stdout.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stdoutHandler?.(Buffer.from('hello'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await promise;
    // `runA365SetupAll` no longer filters stdout itself -- what the user
    // actually sees is decided downstream by `withAgentProgress`'s quiet
    // filter (see agent-shared-progress.test.ts). Callers that need the
    // full raw text (e.g. `extractRegisteredMessagingEndpoint` parsing)
    // still get it here, unmodified and tagged by stream.
    expect(onOutput).toHaveBeenCalledWith('hello', 'stdout');
  });

  it('tags stderr chunks separately from stdout', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);
    const onOutput = vi.fn();

    const promise = runA365SetupAll({ agentName: 'my-agent', cwd: '/work', onOutput });

    const stderrHandler = child.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stderrHandler?.(Buffer.from('ERROR: something went wrong'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await promise;
    expect(onOutput).toHaveBeenCalledWith('ERROR: something went wrong', 'stderr');
  });
});

describe('extractRegisteredMessagingEndpoint', () => {
  it('extracts the endpoint from the Setup Summary table line', () => {
    const output = [
      'Setup Summary',
      '',
      "6. Messaging endpoint           registered   'https://example.devtunnels.ms/api/messages'",
      '',
      'Setup completed successfully',
    ].join('\n');

    expect(extractRegisteredMessagingEndpoint(output)).toBe('https://example.devtunnels.ms/api/messages');
  });

  it('falls back to the inline "Messaging Endpoint:" confirmation line', () => {
    const output = ['Messaging Endpoint: https://example.devtunnels.ms/api/messages', 'Registered successfully.'].join(
      '\n'
    );

    expect(extractRegisteredMessagingEndpoint(output)).toBe('https://example.devtunnels.ms/api/messages');
  });

  it('returns undefined when no endpoint is present', () => {
    expect(extractRegisteredMessagingEndpoint('Setup completed successfully')).toBeUndefined();
  });
});

describe('extractBlueprintSecret', () => {
  it('extracts the secret from a labeled "Client Secret:" line', () => {
    expect(extractBlueprintSecret('Client Secret: abc123~realSecretValue')).toBe('abc123~realSecretValue');
  });

  it('extracts the secret from a bare "Secret:" label', () => {
    expect(extractBlueprintSecret('Some banner\nSecret: abc123~realSecretValue\n')).toBe('abc123~realSecretValue');
  });

  it('falls back to the last non-empty, space-free line when no label is present', () => {
    expect(extractBlueprintSecret('Some banner\n\nabc123~realSecretValue\n')).toBe('abc123~realSecretValue');
  });

  it('returns undefined when nothing looks like a secret', () => {
    expect(extractBlueprintSecret('No setup steps were performed.')).toBeUndefined();
  });
});

describe('runA365ShowSecret', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves with the parsed plaintext secret on success', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365ShowSecret({ cwd: '/work' });

    const stdoutHandler = child.stdout.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stdoutHandler?.(Buffer.from('Client Secret: abc123~realSecretValue\n'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await expect(promise).resolves.toBe('abc123~realSecretValue');
    expect(mockSpawn).toHaveBeenCalledWith('a365', ['setup', 'blueprint', '--show-secret'], {
      cwd: '/work',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  });

  it('rejects with CliError AGENT_SECRET_RETRIEVE_FAILED on non-zero exit', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365ShowSecret({ cwd: '/work' });

    const stderrHandler = child.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stderrHandler?.(Buffer.from('boom'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(1);

    try {
      await promise;
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_SECRET_RETRIEVE_FAILED');
      expect(cliError.suggestion).toContain('boom');
    }
  });

  it('rejects with CliError AGENT_SECRET_RETRIEVE_FAILED when the secret cannot be parsed', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365ShowSecret({ cwd: '/work' });

    const stdoutHandler = child.stdout.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stdoutHandler?.(Buffer.from('No setup steps were performed.\n'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    try {
      await promise;
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_SECRET_RETRIEVE_FAILED');
    }
  });

  it('rejects with CliError AGENT_SECRET_RETRIEVE_FAILED when the process errors', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365ShowSecret({ cwd: '/work' });
    const errorHandler = child.on.mock.calls.find(([event]) => event === 'error')?.[1];
    errorHandler?.(new Error('spawn failed'));

    await expect(promise).rejects.toThrow(CliError);
  });
});

describe('runA365UpdateEndpoint', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves when the process exits with code 0', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365UpdateEndpoint({
      endpoint: 'https://example.devtunnels.ms/api/messages',
      cwd: '/work',
    });

    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await expect(promise).resolves.toBeUndefined();
    expect(mockSpawn).toHaveBeenCalledWith(
      'a365',
      [
        'setup',
        'blueprint',
        '--endpoint-only',
        '--messaging-endpoint',
        'https://example.devtunnels.ms/api/messages',
      ],
      { cwd: '/work', stdio: ['inherit', 'pipe', 'pipe'] }
    );
  });

  it('rejects with CliError AGENT_ENDPOINT_UPDATE_FAILED on non-zero exit', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365UpdateEndpoint({
      endpoint: 'https://example.devtunnels.ms/api/messages',
      cwd: '/work',
    });

    const stderrHandler = child.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stderrHandler?.(Buffer.from('boom'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(1);

    try {
      await promise;
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_ENDPOINT_UPDATE_FAILED');
      expect(cliError.suggestion).toContain('boom');
    }
  });
});

describe('runA365Cleanup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('always passes -y, since confirmation is handled by the caller', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365Cleanup({ cwd: '/work' });

    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await expect(promise).resolves.toBeUndefined();
    expect(mockSpawn).toHaveBeenCalledWith('a365', ['cleanup', '-y'], {
      cwd: '/work',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  });

  it('passes --agent-name and --dry-run when provided', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365Cleanup({ agentName: 'my-agent', dryRun: true, cwd: '/work' });
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);
    await promise;

    expect(mockSpawn).toHaveBeenCalledWith(
      'a365',
      ['cleanup', '-y', '--agent-name', 'my-agent', '--dry-run'],
      { cwd: '/work', stdio: ['inherit', 'pipe', 'pipe'] }
    );
  });

  it('rejects with CliError AGENT_CLEANUP_FAILED on non-zero exit', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365Cleanup({ cwd: '/work' });

    const stderrHandler = child.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stderrHandler?.(Buffer.from('boom'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(1);

    try {
      await promise;
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_CLEANUP_FAILED');
      expect(cliError.suggestion).toContain('boom');
    }
  });
});

describe('runA365Publish', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves when the process exits with code 0', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365Publish({ cwd: '/work' });

    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await expect(promise).resolves.toBeUndefined();
    expect(mockSpawn).toHaveBeenCalledWith('a365', ['publish'], {
      cwd: '/work',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  });

  it('forces --aiteammate alongside an explicit --agent-name', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365Publish({ cwd: '/work', agentName: 'my-agent' });

    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await expect(promise).resolves.toBeUndefined();
    expect(mockSpawn).toHaveBeenCalledWith('a365', ['publish', '--agent-name', 'my-agent', '--aiteammate'], {
      cwd: '/work',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  });

  it('rejects with CliError AGENT_PUBLISH_FAILED on non-zero exit', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365Publish({ cwd: '/work' });

    const stderrHandler = child.stderr.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stderrHandler?.(Buffer.from('boom'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(1);

    try {
      await promise;
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_PUBLISH_FAILED');
      expect(cliError.suggestion).toContain('boom');
    }
  });

  it('rejects with CliError AGENT_PUBLISH_FAILED when the process errors', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365Publish({ cwd: '/work' });
    const errorHandler = child.on.mock.calls.find(([event]) => event === 'error')?.[1];
    errorHandler?.(new Error('spawn failed'));

    await expect(promise).rejects.toThrow(CliError);
  });
});

describe('getManifestPaths', () => {
  it('joins cwd with the manifest folder', () => {
    const paths = getManifestPaths('/work');
    expect(paths.manifestJsonPath).toContain('manifest');
    expect(paths.manifestJsonPath.endsWith('manifest.json')).toBe(true);
    expect(paths.manifestZipPath.endsWith('manifest.zip')).toBe(true);
  });
});

describe('assertManifestPublished', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the manifest paths when both files exist', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const paths = assertManifestPublished('/work');
    expect(paths.manifestJsonPath.endsWith('manifest.json')).toBe(true);
  });

  it('throws CliError AGENT_MANIFEST_NOT_FOUND when a file is missing', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    try {
      assertManifestPublished('/work');
      expect.fail('should have thrown');
    } catch (error) {
      expect((error as CliError).code).toBe('AGENT_MANIFEST_NOT_FOUND');
    }
  });
});

describe('buildDeveloperPortalConfigUrl', () => {
  const original = process.env.TEAMS_DEV_API;

  afterEach(() => {
    if (original === undefined) delete process.env.TEAMS_DEV_API;
    else process.env.TEAMS_DEV_API = original;
    vi.resetModules();
  });

  it('builds a prod agent-blueprint configuration URL by default', () => {
    expect(buildDeveloperPortalConfigUrl('bp-1')).toBe(
      'https://dev.teams.microsoft.com/tools/agent-blueprint/bp-1/configuration'
    );
  });

  it('builds a dev-int agent-blueprint configuration URL when TEAMS_DEV_API=1', async () => {
    process.env.TEAMS_DEV_API = '1';
    vi.resetModules();
    const mod = await import('../src/apps/agent365.js');

    expect(mod.buildDeveloperPortalConfigUrl('bp-1')).toBe(
      'https://dev-int.teams.microsoft.com/tools/agent-blueprint/bp-1/configuration'
    );
  });
});

describe('readGeneratedConfig', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('throws CliError AGENT_CONFIG_NOT_FOUND when the file is missing', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(() => readGeneratedConfig('/work')).toThrow(CliError);
    try {
      readGeneratedConfig('/work');
      expect.fail('should have thrown');
    } catch (error) {
      expect((error as CliError).code).toBe('AGENT_CONFIG_NOT_FOUND');
    }
  });

  it('parses the generated config when present', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        agentBlueprintId: 'bp-1',
        agentBlueprintObjectId: 'bp-obj-1',
        agentBlueprintServicePrincipalObjectId: 'bp-sp-1',
        resourceConsents: ['Microsoft Graph'],
        completed: true,
      })
    );

    const config = readGeneratedConfig('/work');
    expect(config.agentBlueprintId).toBe('bp-1');
    expect(config.completed).toBe(true);
  });

  it('throws CliError AGENT_CONFIG_NOT_FOUND when the file is invalid JSON', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('not json');

    expect(() => readGeneratedConfig('/work')).toThrow(CliError);
  });
});

describe('getGeneratedConfigPath', () => {
  it('joins the cwd with the generated config filename', () => {
    const path = getGeneratedConfigPath('/work');
    expect(path.endsWith('a365.generated.config.json')).toBe(true);
    expect(path).toContain('work');
  });
});

describe('ensureGitignoreEntries', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.clearAllMocks());

  it('creates a .gitignore with the entries when none exists', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    ensureGitignoreEntries('/work', ['.env', 'a365.config.json']);

    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.gitignore'),
      '.env\na365.config.json\n'
    );
  });

  it('appends only missing entries to an existing .gitignore', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('node_modules\n.env\n');

    ensureGitignoreEntries('/work', ['.env', 'a365.config.json', 'a365.generated.config.json']);

    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.gitignore'),
      'node_modules\n.env\na365.config.json\na365.generated.config.json\n'
    );
  });

  it('does nothing when all entries are already present', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue('.env\na365.config.json\n');

    ensureGitignoreEntries('/work', ['.env', 'a365.config.json']);

    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
