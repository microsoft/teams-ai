import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CliError } from '../src/utils/errors.js';

const mockExecFile = vi.fn();
const mockSpawn = vi.fn();
const mockRunAz = vi.fn();

vi.mock('node:child_process', () => ({
  execFile: (...args: unknown[]) => mockExecFile(...args),
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('../src/utils/az.js', () => ({
  runAz: (...args: unknown[]) => mockRunAz(...args),
}));

import { existsSync, readFileSync } from 'node:fs';
import {
  computeBotIdentifierUri,
  getGeneratedConfigPath,
  installA365Cli,
  isA365CliInstalled,
  isDotnetInstalled,
  readGeneratedConfig,
  runA365SetupAll,
  runA365UpdateEndpoint,
  runUpdateBotIdentifierUri,
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

  it('resolves when the process exits with code 0', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365SetupAll({ agentName: 'my-agent', m365: false, cwd: '/work' });

    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await expect(promise).resolves.toBeUndefined();
    expect(mockSpawn).toHaveBeenCalledWith(
      'a365',
      ['setup', 'all', '--agent-name', 'my-agent'],
      { cwd: '/work' }
    );
  });

  it('passes --m365 when requested', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365SetupAll({ agentName: 'my-agent', m365: true, cwd: '/work' });
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);
    await promise;

    expect(mockSpawn).toHaveBeenCalledWith(
      'a365',
      ['setup', 'all', '--agent-name', 'my-agent', '--m365'],
      { cwd: '/work' }
    );
  });

  it('passes --aiteammate when requested', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365SetupAll({
      agentName: 'my-agent',
      m365: true,
      aiteammate: true,
      cwd: '/work',
    });
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);
    await promise;

    expect(mockSpawn).toHaveBeenCalledWith(
      'a365',
      ['setup', 'all', '--agent-name', 'my-agent', '--aiteammate', '--m365'],
      { cwd: '/work' }
    );
  });

  it('rejects with CliError AGENT_SETUP_FAILED on non-zero exit', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365SetupAll({ agentName: 'my-agent', m365: false, cwd: '/work' });

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

    const promise = runA365SetupAll({ agentName: 'my-agent', m365: false, cwd: '/work' });
    const errorHandler = child.on.mock.calls.find(([event]) => event === 'error')?.[1];
    errorHandler?.(new Error('spawn failed'));

    await expect(promise).rejects.toThrow(CliError);
  });

  it('streams output via onOutput', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);
    const onOutput = vi.fn();

    const promise = runA365SetupAll({ agentName: 'my-agent', m365: false, cwd: '/work', onOutput });

    const stdoutHandler = child.stdout.on.mock.calls.find(([event]) => event === 'data')?.[1];
    stdoutHandler?.(Buffer.from('hello'));
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);

    await promise;
    expect(onOutput).toHaveBeenCalledWith('hello');
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
      ['setup', 'blueprint', '--update-endpoint', 'https://example.devtunnels.ms/api/messages'],
      { cwd: '/work' }
    );
  });

  it('passes --agent-name when provided', async () => {
    const child = createFakeChild();
    mockSpawn.mockReturnValue(child);

    const promise = runA365UpdateEndpoint({
      agentName: 'my-agent',
      endpoint: 'https://example.devtunnels.ms/api/messages',
      cwd: '/work',
    });
    const closeHandler = child.on.mock.calls.find(([event]) => event === 'close')?.[1];
    closeHandler?.(0);
    await promise;

    expect(mockSpawn).toHaveBeenCalledWith(
      'a365',
      [
        'setup',
        'blueprint',
        '--update-endpoint',
        'https://example.devtunnels.ms/api/messages',
        '--agent-name',
        'my-agent',
      ],
      { cwd: '/work' }
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

describe('computeBotIdentifierUri', () => {
  it('builds the api://botid-{botId} format required by Teams', () => {
    expect(computeBotIdentifierUri('abc-123')).toBe('api://botid-abc-123');
  });
});

describe('runUpdateBotIdentifierUri', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls az ad app update with --identifier-uris', async () => {
    mockRunAz.mockResolvedValue(undefined);

    await runUpdateBotIdentifierUri('bot-app-1', 'api://botid-abc-123');

    expect(mockRunAz).toHaveBeenCalledWith([
      'ad',
      'app',
      'update',
      '--id',
      'bot-app-1',
      '--identifier-uris',
      'api://botid-abc-123',
    ]);
  });

  it('wraps failures in CliError AGENT_IDENTIFIER_UPDATE_FAILED', async () => {
    mockRunAz.mockRejectedValue(new Error('az not found'));

    try {
      await runUpdateBotIdentifierUri('bot-app-1', 'api://botid-abc-123');
      expect.fail('should have thrown');
    } catch (error) {
      const cliError = error as CliError;
      expect(cliError.code).toBe('AGENT_IDENTIFIER_UPDATE_FAILED');
      expect(cliError.message).toContain('az not found');
      expect(cliError.suggestion).toContain('az ad app update');
    }
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
        managedIdentityPrincipalId: 'mi-1',
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
