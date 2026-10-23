import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import { join } from 'node:path';
import pc from 'picocolors';
import {
  A365_GITIGNORE_ENTRIES,
  ensureGitignoreEntries,
  getGeneratedConfigPath,
  installA365Cli,
  isA365CliInstalled,
  isDotnetInstalled,
  extractRegisteredMessagingEndpoint,
  readGeneratedConfig,
  runA365SetupAll,
  runA365ShowSecret,
  stripA365EnvEntries,
  type AgentGeneratedConfig,
} from '../../apps/agent365.js';
import { CliError, wrapAction } from '../../utils/errors.js';
import { confirmAction, isInteractive } from '../../utils/interactive.js';
import { writeCredentials } from '../../utils/env.js';
import { outputJson } from '../../utils/json-output.js';
import { logger } from '../../utils/logger.js';
import { createSilentSpinner } from '../../utils/spinner.js';
import { renderAgentPublishResult, runAgentPublish } from './publish.js';
import { requireAgentAccount, withAgentProgress, withAgentSpinner } from './shared.js';

export interface AgentCreateOptions {
  json?: boolean;
  /** [OPTIONAL] Working directory for the generated config file. Defaults to process.cwd(). */
  cwd?: string;
}

export interface AgentCreateOutput {
  status: 'completed' | 'pending_admin_consent';
  agentBlueprintId: string;
  agentBlueprintObjectId: string;
  managedIdentityPrincipalId: string;
  messagingEndpoint?: string;
  consentUrl?: string;
  generatedConfigPath: string;
  /** .env path where CLIENT_ID/CLIENT_SECRET/TENANT_ID were written for the Teams SDK app. */
  envPath: string;
  /** True when retrieving the plaintext client secret failed, so CLIENT_SECRET was omitted from .env. */
  secretSkipped?: boolean;
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
  generatedConfigPath: string,
  envPath: string,
  secretSkipped?: boolean
): AgentCreateOutput {
  // Admin consent status comes from each resource's own `consentGranted`
  // flag, not the overall `completed` flag -- `completed: false` can mean
  // other setup steps (e.g. Graph replication) are still catching up even
  // after a365 itself reports "Consent granted (All permissions)", which
  // used to show a false "Admin consent required" warning here.
  const pendingConsent = config.resourceConsents.some((consent) => !consent.consentGranted);
  return {
    status: pendingConsent ? 'pending_admin_consent' : 'completed',
    agentBlueprintId: config.agentBlueprintId,
    agentBlueprintObjectId: config.agentBlueprintObjectId,
    managedIdentityPrincipalId: config.agentBlueprintServicePrincipalObjectId,
    ...(config.messagingEndpoint ? { messagingEndpoint: config.messagingEndpoint } : {}),
    ...(pendingConsent && config.consentUrl ? { consentUrl: config.consentUrl } : {}),
    generatedConfigPath,
    envPath,
    ...(secretSkipped ? { secretSkipped: true } : {}),
  };
}

function renderAgentCreateResult(output: AgentCreateOutput): void {
  logger.info('');
  logger.info(`${pc.dim('Agent blueprint ID:')} ${output.agentBlueprintId}`);
  logger.info(`${pc.dim('Managed identity principal ID:')} ${output.managedIdentityPrincipalId}`);
  if (output.messagingEndpoint) {
    logger.info(`${pc.dim('Messaging endpoint:')} ${output.messagingEndpoint}`);
  } else {
    logger.info(
      `${pc.dim('Messaging endpoint:')} not set yet — run ${pc.cyan('teams agent endpoint <url>')} once your agent is deployed.`
    );
  }
  logger.info(`${pc.dim('Generated config:')} ${output.generatedConfigPath}`);
  logger.info(
    `${pc.dim('Teams SDK credentials:')} ${output.envPath} ${pc.dim(output.secretSkipped ? '(CLIENT_ID/TENANT_ID)' : '(CLIENT_ID/CLIENT_SECRET/TENANT_ID)')}`
  );
  if (output.secretSkipped) {
    logger.warn(
      `CLIENT_SECRET could not be retrieved automatically. Run ${pc.cyan('a365 setup blueprint --show-secret')} in this folder and add it to ${pc.cyan(output.envPath)} yourself.`
    );
  }

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

  const name = await resolveAgentName(nameArg, silent);
  const account = await requireAgentAccount();
  await ensureA365CliReady(silent);

  const cwd = options.cwd ?? process.cwd();
  let setupOutput = '';
  await withAgentProgress(
    {
      start: 'Creating agent identity...',
      success: 'Agent identity created.',
      error: 'Agent setup failed.',
    },
    silent,
    (onOutput) =>
      runA365SetupAll({
        agentName: name,
        cwd,
        onOutput: (chunk, stream) => {
          setupOutput += chunk;
          onOutput(chunk, stream);
        },
      })
  );

  const config = readGeneratedConfig(cwd);
  // `a365.generated.config.json` doesn't reliably persist `messagingEndpoint`
  // even right after a successful registration, so fall back to parsing it
  // out of this run's console output.
  const registeredMessagingEndpoint = config.messagingEndpoint ?? extractRegisteredMessagingEndpoint(setupOutput);

  // `agentBlueprintClientSecret` in the generated config is DPAPI-protected
  // ciphertext on Windows, not a usable plaintext value -- retrieve the real
  // secret via `a365 setup blueprint --show-secret` instead of trusting it.
  let clientSecret: string | undefined;
  let secretSkipped = false;
  try {
    clientSecret = await withAgentSpinner(
      {
        start: 'Retrieving client secret...',
        success: 'Client secret retrieved.',
        error: 'Could not retrieve client secret.',
      },
      silent,
      () => runA365ShowSecret({ cwd })
    );
  } catch (error) {
    secretSkipped = true;
    logger.debug(`Failed to retrieve client secret: ${error instanceof Error ? error.message : String(error)}`);
  }

  // `a365 setup all` writes its own .env (dotnet Agent SDK naming, e.g.
  // `CONNECTIONS__SERVICE_CONNECTION__SETTINGS__CLIENTID`) regardless of the
  // target project's language. Strip those out first so TypeScript/Python/C#
  // Teams SDK apps only see the credentials they actually expect.
  const envPath = join(cwd, '.env');
  stripA365EnvEntries(cwd);
  writeCredentials(envPath, {
    CLIENT_ID: config.agentBlueprintId,
    ...(clientSecret ? { CLIENT_SECRET: clientSecret } : {}),
    TENANT_ID: account.tenantId,
  });
  ensureGitignoreEntries(cwd, ['.env', ...A365_GITIGNORE_ENTRIES]);

  const output = toAgentCreateOutput(
    { ...config, messagingEndpoint: registeredMessagingEndpoint },
    getGeneratedConfigPath(cwd),
    envPath,
    secretSkipped
  );

  if (options.json) {
    outputJson(output);
    return output;
  }

  renderAgentCreateResult(output);
  await runPostCreateWizard(cwd);

  return output;
}

/**
 * Chains straight into `publish` right after creation so you don't have to
 * type it as a separate command. `a365 setup all` already registers the
 * messaging endpoint itself (and on dev-int it still needs a manual Teams
 * Developer Portal step regardless of anything we'd do here), so there's
 * nothing else for us to check/update first. Only runs in an interactive,
 * non-JSON session.
 */
async function runPostCreateWizard(cwd: string): Promise<void> {
  if (!isInteractive()) return;

  if (!(await confirmAction('Publish agent now?', false))) {
    return;
  }

  const publishOutput = await runAgentPublish({}, cwd);
  await renderAgentPublishResult(publishOutput);
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
