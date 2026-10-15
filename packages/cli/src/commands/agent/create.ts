import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import {
  getGeneratedConfigPath,
  installA365Cli,
  isA365CliInstalled,
  isDotnetInstalled,
  readGeneratedConfig,
  runA365SetupAll,
  type AgentGeneratedConfig,
} from '../../apps/agent365.js';
import { CliError, wrapAction } from '../../utils/errors.js';
import { confirmAction, isInteractive } from '../../utils/interactive.js';
import { outputJson } from '../../utils/json-output.js';
import { isVerbose, logger } from '../../utils/logger.js';
import { createSilentSpinner } from '../../utils/spinner.js';
import { requireAgentAccount, withAgentSpinner } from './shared.js';

export interface AgentCreateOptions {
  json?: boolean;
}

export interface AgentCreateOutput {
  status: 'completed' | 'pending_admin_consent';
  agentBlueprintId: string;
  agentBlueprintObjectId: string;
  managedIdentityPrincipalId: string;
  messagingEndpoint?: string;
  consentUrl?: string;
  generatedConfigPath: string;
}

async function ensureA365CliReady(silent: boolean): Promise<void> {
  const spinner = createSilentSpinner('Checking Agent 365 CLI...', silent).start();

  if (!(await isDotnetInstalled())) {
    spinner.error({ text: '.NET is required but was not found.' });
    throw new CliError(
      'DOTNET_REQUIRED',
      '.NET 8+ is required to run the Agent 365 CLI.',
      'Install .NET from https://dotnet.microsoft.com/download, then try again.'
    );
  }

  if (await isA365CliInstalled()) {
    spinner.success({ text: 'Agent 365 CLI is ready.' });
    return;
  }

  spinner.update({ text: 'Installing Agent 365 CLI...' });
  if (!(await confirmAction('Agent 365 CLI (a365) is not installed. Install it now?', silent))) {
    spinner.error({ text: 'Agent 365 CLI install declined.' });
    throw new CliError(
      'AGENT_365_CLI_INSTALL_FAILED',
      'The Agent 365 CLI is required to create an agent identity.',
      'Run `dotnet tool install --global Microsoft.Agents.A365.DevTools.Cli`, then try again.'
    );
  }

  await installA365Cli();
  spinner.success({ text: 'Agent 365 CLI installed.' });
}

async function resolveAgentName(nameArg: string | undefined, silent: boolean): Promise<string> {
  if (nameArg?.trim()) return nameArg.trim();

  if (!isInteractive() || silent) {
    throw new CliError(
      'AGENT_NAME_REQUIRED',
      'An agent name is required in non-interactive mode.',
      'Pass it as an argument: `teams agent create <name>`.'
    );
  }

  const name = await input({ message: 'Agent name:' });
  if (!name.trim()) {
    throw new CliError('AGENT_NAME_REQUIRED', 'Agent name cannot be empty.');
  }
  return name.trim();
}

export function toAgentCreateOutput(
  config: AgentGeneratedConfig,
  generatedConfigPath: string
): AgentCreateOutput {
  const pendingConsent = !config.completed || config.resourceConsents.length === 0;
  return {
    status: pendingConsent ? 'pending_admin_consent' : 'completed',
    agentBlueprintId: config.agentBlueprintId,
    agentBlueprintObjectId: config.agentBlueprintObjectId,
    managedIdentityPrincipalId: config.managedIdentityPrincipalId,
    ...(config.messagingEndpoint ? { messagingEndpoint: config.messagingEndpoint } : {}),
    ...(pendingConsent && config.consentUrl ? { consentUrl: config.consentUrl } : {}),
    generatedConfigPath,
  };
}

function renderAgentCreateResult(output: AgentCreateOutput): void {
  logger.info(pc.bold(pc.green('\nAgent identity created!')));
  logger.info(`${pc.dim('Agent blueprint ID:')} ${output.agentBlueprintId}`);
  logger.info(`${pc.dim('Managed identity principal ID:')} ${output.managedIdentityPrincipalId}`);
  if (output.messagingEndpoint) {
    logger.info(`${pc.dim('Messaging endpoint:')} ${output.messagingEndpoint}`);
  }
  logger.info(`${pc.dim('Generated config:')} ${output.generatedConfigPath}`);

  if (output.status === 'pending_admin_consent') {
    logger.info('');
    logger.info(pc.yellow('⚠ Admin consent required'));
    logger.info(
      pc.yellow(
        'A Global Administrator must grant API permissions before this agent identity is fully active.'
      )
    );
    if (output.consentUrl) {
      logger.info(`Share this URL with your Global Administrator: ${pc.cyan(output.consentUrl)}`);
    } else {
      logger.info('Check the Agent 365 CLI output above for the consent URL to share.');
    }
  }
}

export async function runAgentCreate(
  nameArg: string | undefined,
  options: AgentCreateOptions
): Promise<AgentCreateOutput> {
  const silent = !!options.json;
  const verbose = isVerbose();

  const name = await resolveAgentName(nameArg, silent);
  await requireAgentAccount();
  await ensureA365CliReady(silent);

  const cwd = process.cwd();
  await withAgentSpinner(
    {
      start: 'Creating agent identity...',
      success: 'Agent identity created.',
      error: 'Agent setup failed.',
    },
    silent,
    () =>
      runA365SetupAll({
        agentName: name,
        cwd,
        onOutput: verbose ? (chunk) => process.stdout.write(chunk) : undefined,
      })
  );

  const config = readGeneratedConfig(cwd);
  const output = toAgentCreateOutput(config, getGeneratedConfigPath(cwd));

  if (options.json) {
    outputJson(output);
  } else {
    renderAgentCreateResult(output);
  }

  return output;
}

export const agentCreateCommand = new Command('create')
  .description('Create an Agent 365 agent identity')
  .argument('[name]', 'Agent name')
  .option('--json', '[OPTIONAL] Output as JSON')
  .action(
    wrapAction(async (nameArg: string | undefined, options: AgentCreateOptions) => {
      await runAgentCreate(nameArg, options);
    })
  );
