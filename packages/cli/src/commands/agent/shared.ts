import type { AccountInfo } from '@azure/msal-node';
import { input } from '@inquirer/prompts';
import { existsSync } from 'node:fs';
import pc from 'picocolors';
import { getGeneratedConfigPath, isA365CliInstalled, isDotnetInstalled } from '../../apps/agent365.js';
import { getAccount } from '../../auth/index.js';
import { ensureTenantMatch } from '../../utils/az-prompts.js';
import { CliError } from '../../utils/errors.js';
import { isInteractive } from '../../utils/interactive.js';
import { createSilentSpinner } from '../../utils/spinner.js';
import { logger } from '../../utils/logger.js';

/**
 * Preflight shared by every `teams agent` subcommand: requires a logged-in
 * account and verifies the Azure CLI's active tenant matches it. Returns
 * the account for commands that need it (e.g. tenantId).
 */
export async function requireAgentAccount(): Promise<AccountInfo> {
  const account = await getAccount();
  if (!account) {
    throw new CliError('AUTH_REQUIRED', 'Not logged in.', 'Run `teams login` first.');
  }
  await ensureTenantMatch(account.tenantId);
  return account;
}

/**
 * Throws if the Agent 365 CLI isn't already installed. Unlike the
 * install-and-prompt flow in `teams agent create`, subcommands that operate
 * on an existing blueprint just need the tool to already be there.
 */
export async function assertA365CliAvailable(): Promise<void> {
  if (!(await isDotnetInstalled()) || !(await isA365CliInstalled())) {
    throw new CliError(
      'AGENT_365_CLI_INSTALL_FAILED',
      'The Agent 365 CLI is required for this command.',
      'Run `teams agent create <name>` first, or `dotnet tool install --global Microsoft.Agents.A365.DevTools.Cli`.'
    );
  }
}

export interface AgentSpinnerText {
  start: string;
  success: string;
  error: string;
}

/**
 * `a365` commands (cleanup/publish/endpoint) fall back to the local
 * `a365.generated.config.json` for the agent name when no `--agent-name`
 * is given -- if that file isn't in `cwd` (e.g. run from outside the
 * project folder), they exit with a confusing "Agent name required." Shared
 * across those subcommands: resolve the name upfront, prompting for it
 * interactively instead of passing through to that error.
 */
export async function resolveAgentName(
  nameArg: string | undefined,
  cwd: string,
  silent: boolean
): Promise<string | undefined> {
  if (nameArg?.trim()) return nameArg.trim();
  if (existsSync(getGeneratedConfigPath(cwd))) return undefined;

  if (!isInteractive() || silent) {
    throw new CliError(
      'AGENT_NAME_REQUIRED',
      `No ${pc.cyan('a365.generated.config.json')} found in ${cwd}.`,
      'Pass the agent name as an argument, or run this from the project folder.'
    );
  }

  const name = await input({ message: 'Agent name (no config file found in this folder):' });
  if (!name.trim()) {
    throw new CliError('AGENT_NAME_REQUIRED', 'Agent name cannot be empty.');
  }
  return name.trim();
}

/**
 * Runs `fn` under a spinner, flipping it to the error state before
 * rethrowing on failure. Shared across `teams agent` subcommands so each
 * one only supplies spinner copy and its own logic.
 */
export async function withAgentSpinner<T>(
  text: AgentSpinnerText,
  silent: boolean,
  fn: (spinner: ReturnType<typeof createSilentSpinner>) => Promise<T>
): Promise<T> {
  const spinner = createSilentSpinner(text.start, silent).start();
  try {
    const result = await fn(spinner);
    spinner.success({ text: text.success });
    return result;
  } catch (error) {
    spinner.error({ text: text.error });
    throw error;
  }
}

/** How long to hold back trailing, non-newline-terminated stdout content before treating it as a genuine prompt. */
const QUIET_FLUSH_DELAY_MS = 200;

/**
 * Buffers `a365`'s raw stdout so only content it's actively waiting on --
 * an interactive prompt written without a trailing newline (e.g. "Open
 * manifest in your default editor now? (Y/n): "), immediately followed by
 * a block on stdin -- ever reaches the terminal. Everything else (version
 * banners, requirement checks, "Next steps" boilerplate, etc.) is dropped;
 * `teams agent` surfaces the information the user actually needs itself.
 *
 * `a365` writes a prompt with no trailing newline and then blocks on
 * stdin, so a completed line is always followed promptly by more output,
 * while a genuine prompt is followed by nothing for as long as a human
 * takes to respond. We lean on that: trailing, non-newline-terminated
 * content is held behind a short timer and only shown once nothing else
 * arrives in time.
 *
 * `onActivity`/`onPrompt` let callers track whether a prompt is currently
 * visible, so e.g. the "still working" ticker can pause while the process
 * is genuinely waiting on the user rather than doing silent work.
 */
function createQuietStdout(
  write: (chunk: string) => void,
  onActivity: () => void,
  onPrompt: () => void
): { feed: (chunk: string) => void; dispose: () => void } {
  let carry = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };

  return {
    feed: (chunk: string) => {
      clearTimer();
      onActivity(); // new output means the process is working again, not waiting on input
      carry += chunk;
      const lines = carry.split('\n');
      carry = lines.pop() ?? ''; // complete lines are informational noise -- drop them
      if (!carry) return;
      timer = setTimeout(() => {
        write(carry);
        carry = '';
        onPrompt(); // nothing followed in time -- this is a genuine prompt, now visible to the user
      }, QUIET_FLUSH_DELAY_MS);
    },
    dispose: clearTimer,
  };
}

/** How often to print a "still working" update during a long-running `a365` operation with no output. */
const PROGRESS_TICK_INTERVAL_MS = 15_000;

/**
 * Runs `fn` for an operation that spawns `a365` with inherited stdin, since
 * it can prompt interactively (e.g. "Assign this application permission
 * now? [y/N]:"). An animated spinner actively breaks that: its per-frame
 * clear+redraw stomps on the terminal's native echo of what the user types.
 * So, unlike `withAgentSpinner`, this streams `a365`'s output directly
 * instead of funneling it through a spinner's last-line text -- but only
 * its interactive prompts and stderr (errors/warnings); informational
 * stdout noise is dropped (see `createQuietStdout`).
 *
 * `a365 setup all` in particular can run silently for minutes (e.g.
 * waiting on Graph replication) with nothing to show under that filter --
 * long enough to look hung. A periodic "still working" line (plain
 * newline-terminated, never a redraw) reassures the user without risking
 * the same stdin-echo corruption a spinner would cause if a prompt happens
 * to be live at the same time.
 */
export async function withAgentProgress<T>(
  text: AgentSpinnerText,
  silent: boolean,
  fn: (onOutput: (chunk: string, stream: 'stdout' | 'stderr') => void) => Promise<T>
): Promise<T> {
  if (!silent) logger.info(text.start);
  let awaitingInput = false;
  const quietStdout = silent
    ? undefined
    : createQuietStdout(
        (chunk) => process.stdout.write(chunk),
        () => (awaitingInput = false), // new output arrived -- a365 is working again, not waiting on us
        () => (awaitingInput = true) // nothing followed in time -- a365 is now blocked on a visible prompt
      );

  const startedAt = Date.now();
  const tickTimer = silent
    ? undefined
    : setInterval(() => {
        if (awaitingInput) return; // don't nag while a365 is visibly waiting for the user to type
        const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
        logger.info(pc.dim(`  Still working... (${elapsedSec}s elapsed, this can take a few minutes)`));
      }, PROGRESS_TICK_INTERVAL_MS);

  try {
    const result = await fn((chunk, stream) => {
      if (silent) return;
      if (stream === 'stderr') {
        process.stderr.write(chunk);
      } else {
        quietStdout?.feed(chunk);
      }
    });
    if (!silent) logger.info(pc.green(text.success));
    return result;
  } catch (error) {
    if (!silent) logger.error(pc.red(text.error));
    throw error;
  } finally {
    quietStdout?.dispose();
    if (tickTimer) clearInterval(tickTimer);
  }
}
