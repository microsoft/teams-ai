import { Command } from 'commander';
import pc from 'picocolors';
import {
  computeBotIdentifierUri,
  getGeneratedConfigPath,
  readGeneratedConfig,
  runUpdateBotIdentifierUri,
} from '../../apps/agent365.js';
import { ensureAz } from '../../utils/az.js';
import { CliError, wrapAction } from '../../utils/errors.js';
import { outputJson } from '../../utils/json-output.js';
import { logger } from '../../utils/logger.js';
import { requireAgentAccount, withAgentSpinner } from './shared.js';

export interface AgentUpdateIdentifierOptions {
  json?: boolean;
}

export interface AgentUpdateIdentifierOutput {
  botAppId: string;
  identifierUri: string;
  generatedConfigPath: string;
}

export const agentUpdateIdentifierCommand = new Command('update-identifier')
  .description("Set the bot's AAD app identifier URI (SSO URI) to the Teams-required api://botid-{botId} format")
  .option('--json', '[OPTIONAL] Output as JSON')
  .action(
    wrapAction(async (options: AgentUpdateIdentifierOptions) => {
      const silent = !!options.json;

      await requireAgentAccount();
      await ensureAz();

      const cwd = process.cwd();
      const config = readGeneratedConfig(cwd);
      const botAppId = config.botMsaAppId;
      if (!botAppId || !config.botId) {
        throw new CliError(
          'AGENT_BOT_NOT_FOUND',
          'No bot registration was found in a365.generated.config.json.',
          'Run `teams agent create <name> --m365` first to register a bot.'
        );
      }

      const identifierUri = computeBotIdentifierUri(config.botId);

      await withAgentSpinner(
        {
          start: 'Updating bot identifier URI...',
          success: 'Bot identifier URI updated.',
          error: 'Bot identifier URI update failed.',
        },
        silent,
        () => runUpdateBotIdentifierUri(botAppId, identifierUri)
      );

      const output: AgentUpdateIdentifierOutput = {
        botAppId,
        identifierUri,
        generatedConfigPath: getGeneratedConfigPath(cwd),
      };

      if (options.json) {
        outputJson(output);
        return;
      }

      logger.info(pc.bold(pc.green('\nBot identifier URI updated!')));
      logger.info(`${pc.dim('Bot app ID:')} ${output.botAppId}`);
      logger.info(`${pc.dim('Identifier URI:')} ${output.identifierUri}`);
    })
  );

