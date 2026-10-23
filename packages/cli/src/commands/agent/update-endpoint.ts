import { input } from '@inquirer/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { existsSync } from 'node:fs';
import { buildDeveloperPortalConfigUrl, getGeneratedConfigPath, readGeneratedConfig, runA365UpdateEndpoint } from '../../apps/agent365.js';
import { CliError, wrapAction } from '../../utils/errors.js';
import { isInteractive } from '../../utils/interactive.js';
import { outputJson } from '../../utils/json-output.js';
import { logger } from '../../utils/logger.js';
import { isDevApiEnabled } from '../../utils/tdp-host.js';
import { assertA365CliAvailable, requireAgentAccount, withAgentProgress } from './shared.js';

export interface AgentUpdateEndpointOptions {
  json?: boolean;
}

export interface AgentUpdateEndpointOutput {
  agentBlueprintId: string;
  messagingEndpoint?: string;
  generatedConfigPath: string;
}

function assertHttpsEndpoint(endpoint: string): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new CliError(
      'AGENT_ENDPOINT_INVALID',
      `"${endpoint}" is not a valid URL.`,
      'Pass a full HTTPS URL, e.g. https://your-tunnel.devtunnels.ms/api/messages'
    );
  }
  if (url.protocol !== 'https:') {
    throw new CliError(
      'AGENT_ENDPOINT_INVALID',
      `The messaging endpoint must use HTTPS: "${endpoint}"`,
      'Pass a full HTTPS URL, e.g. https://your-tunnel.devtunnels.ms/api/messages'
    );
  }
}

/** Prompts for the messaging endpoint when not passed as an argument. */
async function resolveEndpoint(endpointArg: string | undefined, silent: boolean): Promise<string> {
  if (endpointArg?.trim()) return endpointArg.trim();

  if (!isInteractive() || silent) {
    throw new CliError(
      'AGENT_ENDPOINT_REQUIRED',
      'A messaging endpoint is required in non-interactive mode.',
      'Pass it as an argument: `teams agent endpoint <url>`.'
    );
  }

  const endpoint = await input({ message: 'Messaging endpoint (HTTPS URL):' });
  if (!endpoint.trim()) {
    throw new CliError('AGENT_ENDPOINT_REQUIRED', 'Messaging endpoint cannot be empty.');
  }
  return endpoint.trim();
}

/**
 * Unlike `publish`/`cleanup`, `a365 setup blueprint --endpoint-only` has no
 * working `--agent-name` fallback (see the comment on `runA365UpdateEndpoint`
 * in `apps/agent365.ts`) -- it always reads the config file from `cwd`
 * regardless of what name is passed. So there's nothing to prompt for here;
 * just fail clearly if the config file this operation actually needs isn't
 * there.
 */
function assertGeneratedConfigExists(cwd: string): void {
  if (existsSync(getGeneratedConfigPath(cwd))) return;

  throw new CliError(
    'AGENT_CONFIG_NOT_FOUND',
    `No ${pc.cyan('a365.generated.config.json')} found in ${cwd}.`,
    'Run `teams agent endpoint` from your agent project directory (where `teams agent create` wrote the config file).'
  );
}

/**
 * On dev-int, `a365 setup blueprint --endpoint-only` only updates the
 * Entra/Graph-side blueprint record -- it isn't wired up to TDP's
 * message-routing config, so the agent still won't receive messages even
 * though the command reports success. Until that's fixed upstream, fail
 * fast and point people at the Developer Portal page where the messaging
 * endpoint can actually be registered for dev-int routing, instead of
 * running `a365` and giving a false sense of success.
 */
function assertNotDevInt(cwd: string): void {
  if (!isDevApiEnabled()) return;

  const { agentBlueprintId } = readGeneratedConfig(cwd);
  throw new CliError(
    'AGENT_ENDPOINT_DEV_INT_UNSUPPORTED',
    'Updating the messaging endpoint via `a365` does not take effect on dev-int (TEAMS_DEV_API=1) yet.',
    `Set it manually in the Teams Developer Portal instead: ${buildDeveloperPortalConfigUrl(agentBlueprintId)}`
  );
}

export function renderAgentUpdateEndpointResult(output: AgentUpdateEndpointOutput): void {
  logger.info('');
  logger.info(`${pc.dim('Agent blueprint ID:')} ${output.agentBlueprintId}`);
  if (output.messagingEndpoint) {
    logger.info(`${pc.dim('Messaging endpoint:')} ${output.messagingEndpoint}`);
  }
}

/**
 * Updates the messaging endpoint on an existing blueprint. `endpoint` is
 * prompted for interactively when omitted. `teams agent create`'s
 * post-create wizard doesn't call this -- it registers the endpoint by
 * passing it straight to `a365 setup all`, and on dev-int just tells the
 * user to set it manually (see `create.ts`); this command is purely for
 * re-registering it later (e.g. a new devtunnel session).
 */
export async function runAgentUpdateEndpoint(
  endpointArg: string | undefined,
  options: AgentUpdateEndpointOptions,
  cwd: string = process.cwd()
): Promise<AgentUpdateEndpointOutput> {
  const silent = !!options.json;

  await assertA365CliAvailable();
  assertGeneratedConfigExists(cwd);
  assertNotDevInt(cwd);
  const endpoint = await resolveEndpoint(endpointArg, silent);
  assertHttpsEndpoint(endpoint);

  await withAgentProgress(
    {
      start: 'Updating messaging endpoint...',
      success: 'Messaging endpoint updated.',
      error: 'Messaging endpoint update failed.',
    },
    silent,
    (onOutput) =>
      runA365UpdateEndpoint({
        endpoint,
        cwd,
        onOutput,
      })
  );

  const config = readGeneratedConfig(cwd);
  return {
    agentBlueprintId: config.agentBlueprintId,
    ...(config.messagingEndpoint ? { messagingEndpoint: config.messagingEndpoint } : {}),
    generatedConfigPath: getGeneratedConfigPath(cwd),
  };
}

export const agentUpdateEndpointCommand = new Command('endpoint')
  .description('Update the messaging endpoint on an existing Agent 365 blueprint')
  .argument('[endpoint]', 'HTTPS URL for the messaging endpoint')
  .option('--json', '[OPTIONAL] Output as JSON')
  .action(
    wrapAction(async (endpoint: string | undefined, options: AgentUpdateEndpointOptions) => {
      await requireAgentAccount();
      const output = await runAgentUpdateEndpoint(endpoint, options);

      if (options.json) {
        outputJson(output);
        return;
      }
      renderAgentUpdateEndpointResult(output);
    })
  );

