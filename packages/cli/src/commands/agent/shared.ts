import type { AccountInfo } from '@azure/msal-node';
import { isA365CliInstalled, isDotnetInstalled } from '../../apps/agent365.js';
import { getAccount } from '../../auth/index.js';
import { ensureTenantMatch } from '../../utils/az-prompts.js';
import { CliError } from '../../utils/errors.js';
import { createSilentSpinner } from '../../utils/spinner.js';

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
 * Runs `fn` under a spinner, flipping it to the error state before
 * rethrowing on failure. Shared across `teams agent` subcommands so each
 * one only supplies spinner copy and its own logic.
 */
export async function withAgentSpinner<T>(
  text: AgentSpinnerText,
  silent: boolean,
  fn: () => Promise<T>
): Promise<T> {
  const spinner = createSilentSpinner(text.start, silent).start();
  try {
    const result = await fn();
    spinner.success({ text: text.success });
    return result;
  } catch (error) {
    spinner.error({ text: text.error });
    throw error;
  }
}
