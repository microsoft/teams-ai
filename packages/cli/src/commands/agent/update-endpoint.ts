import { Command } from 'commander';
import pc from 'picocolors';
import { getGeneratedConfigPath, readGeneratedConfig, runA365UpdateEndpoint } from '../../apps/agent365.js';
import { CliError, wrapAction } from '../../utils/errors.js';
import { outputJson } from '../../utils/json-output.js';
import { isVerbose, logger } from '../../utils/logger.js';
import { assertA365CliAvailable, requireAgentAccount, withAgentSpinner } from './shared.js';

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

export const agentUpdateEndpointCommand = new Command('update-endpoint')
  .description('Update the messaging endpoint on an existing Agent 365 blueprint')
  .argument('<endpoint>', 'HTTPS URL for the messaging endpoint')
  .argument('[name]', '[OPTIONAL] Agent name. Not needed if a365.generated.config.json exists in the current directory')
  .option('--json', '[OPTIONAL] Output as JSON')
  .action(
    wrapAction(async (endpoint: string, nameArg: string | undefined, options: AgentUpdateEndpointOptions) => {
      const silent = !!options.json;
      const verbose = isVerbose();

      assertHttpsEndpoint(endpoint);
      await requireAgentAccount();
      await assertA365CliAvailable();

      const cwd = process.cwd();
      await withAgentSpinner(
        {
          start: 'Updating messaging endpoint...',
          success: 'Messaging endpoint updated.',
          error: 'Messaging endpoint update failed.',
        },
        silent,
        () =>
          runA365UpdateEndpoint({
            agentName: nameArg,
            endpoint,
            cwd,
            onOutput: verbose ? (chunk) => process.stdout.write(chunk) : undefined,
          })
      );

      const config = readGeneratedConfig(cwd);
      const output: AgentUpdateEndpointOutput = {
        agentBlueprintId: config.agentBlueprintId,
        ...(config.messagingEndpoint ? { messagingEndpoint: config.messagingEndpoint } : {}),
        generatedConfigPath: getGeneratedConfigPath(cwd),
      };

      if (options.json) {
        outputJson(output);
        return;
      }

      logger.info(pc.bold(pc.green('\nMessaging endpoint updated!')));
      logger.info(`${pc.dim('Agent blueprint ID:')} ${output.agentBlueprintId}`);
      if (output.messagingEndpoint) {
        logger.info(`${pc.dim('Messaging endpoint:')} ${output.messagingEndpoint}`);
      }
    })
  );
