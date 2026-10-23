import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withAgentProgress } from '../src/commands/agent/shared.js';

// `withAgentProgress` is the layer that decides what the user actually
// sees of `a365`'s raw output: only its interactive prompts (stdout
// content never terminated with a newline, since `a365` writes a prompt
// and blocks on stdin) and anything on stderr (errors/warnings). Plain
// informational stdout lines -- version banners, requirement checks,
// "Next steps" boilerplate, etc. -- are dropped, since `teams agent`
// surfaces what the user needs itself.
describe('withAgentProgress quiet stdout filtering', () => {
  let stdoutWrite: ReturnType<typeof vi.spyOn>;
  let stderrWrite: ReturnType<typeof vi.spyOn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    // `logger.info`/`text.start`/`text.success`/periodic ticks go through
    // `console.log`, which doesn't call through to `process.stdout.write`
    // under Vitest's test console -- spy on it directly to assert on that
    // content.
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    stdoutWrite.mockRestore();
    stderrWrite.mockRestore();
    consoleLog.mockRestore();
  });

  // `withAgentProgress` itself prints its own spinner-style start/success/
  // error banners via `logger` (console.log/console.error, which go
  // through `process.stdout`/`process.stderr`). Join all captured writes
  // so assertions only care about the *a365* content under test, not our
  // own banner text.
  const allStdout = () => stdoutWrite.mock.calls.map((call) => call[0]).join('');
  const allStderr = () => stderrWrite.mock.calls.map((call) => call[0]).join('');
  const allConsoleLog = () => consoleLog.mock.calls.map((call) => call.join(' ')).join('\n');

  const text = { start: 'Starting...', success: 'Done.', error: 'Failed.' };

  it('drops completed stdout lines (informational noise)', async () => {
    await withAgentProgress(text, false, async (onOutput) => {
      onOutput('Checking requirements...\n    Pass: Azure Authentication\n', 'stdout');
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(allStdout()).not.toContain('Checking requirements');
    expect(allStdout()).not.toContain('Pass: Azure Authentication');
  });

  it('forwards a trailing, non-newline-terminated stdout chunk once nothing else arrives (a genuine prompt)', async () => {
    await withAgentProgress(text, false, async (onOutput) => {
      onOutput('Messaging Endpoint: ', 'stdout');
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(allStdout()).toContain('Messaging Endpoint: ');
  });

  it('does not forward a partial line if more stdout data completes it before the flush timer fires', async () => {
    await withAgentProgress(text, false, async (onOutput) => {
      onOutput('Next steps', 'stdout');
      await vi.advanceTimersByTimeAsync(50);
      onOutput(':\n', 'stdout');
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(allStdout()).not.toContain('Next steps');
  });

  it('always forwards stderr immediately, without buffering', async () => {
    await withAgentProgress(text, false, async (onOutput) => {
      onOutput('ERROR: Configuration file not found.\n', 'stderr');
    });

    expect(allStderr()).toContain('ERROR: Configuration file not found.');
    expect(allStdout()).not.toContain('ERROR');
  });

  it('suppresses a365 output (including prompts) in silent mode, but still runs fn', async () => {
    let ran = false;
    await withAgentProgress(text, true, async (onOutput) => {
      onOutput('Messaging Endpoint: ', 'stdout');
      onOutput('ERROR: boom\n', 'stderr');
      await vi.advanceTimersByTimeAsync(500);
      ran = true;
    });

    expect(ran).toBe(true);
    expect(allStdout()).not.toContain('Messaging Endpoint');
    expect(allStderr()).not.toContain('ERROR: boom');
  });

  it('prints a periodic "still working" update during a long silent run', async () => {
    await withAgentProgress(text, false, async () => {
      await vi.advanceTimersByTimeAsync(31_000); // past two 15s ticks
    });

    expect(allConsoleLog()).toContain('Still working');
  });

  it('does not print a "still working" update for a short-lived run', async () => {
    await withAgentProgress(text, false, async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(allConsoleLog()).not.toContain('Still working');
  });

  it('does not print a "still working" update in silent mode', async () => {
    await withAgentProgress(text, true, async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });

    expect(allConsoleLog()).not.toContain('Still working');
  });
});
