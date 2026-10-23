import { select } from '@inquirer/prompts';
import { Command } from 'commander';
import { existsSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import pc from 'picocolors';
import {
  assertManifestPublished,
  buildDeveloperPortalConfigUrl,
  getGeneratedConfigPath,
  getManifestPaths,
  M365_ADMIN_CENTER_AGENTS_URL,
  readGeneratedConfig,
  runA365Publish,
  tryReadBlueprintIdFromManifest,
} from '../../apps/agent365.js';
import { openInBrowser } from '../../utils/browser.js';
import { CliError, wrapAction } from '../../utils/errors.js';
import { isInteractive } from '../../utils/interactive.js';
import { outputJson } from '../../utils/json-output.js';
import { logger } from '../../utils/logger.js';
import { isDevApiEnabled } from '../../utils/tdp-host.js';
import { assertA365CliAvailable, requireAgentAccount, resolveAgentName, withAgentProgress } from './shared.js';

export interface AgentPublishOptions {
  json?: boolean;
}

export interface AgentPublishOutput {
  /**
   * Omitted when publishing name-only outside a `setup all` folder --
   * `publish` never writes `a365.generated.config.json` itself, and the
   * manifest-based fallback (`tryReadBlueprintIdFromManifest`) can fail to
   * find it too.
   */
  agentBlueprintId?: string;
  manifestJsonPath: string;
  manifestZipPath: string;
  /** Only set when `a365.generated.config.json` exists in `cwd` (i.e. not a name-only publish). */
  generatedConfigPath?: string;
  /** Only set on dev-int (TEAMS_DEV_API=1) -- on prod the messaging endpoint is configured automatically, no manual Developer Portal step needed. */
  developerPortalConfigUrl?: string;
  adminCenterUploadUrl: string;
}

/**
 * `a365 publish` can silently reuse an already-existing `manifest/` folder
 * instead of regenerating it (observed: no "Extracting manifest
 * templates..."/"Manifest updated" lines at all, just straight to "Agent
 * package created!") -- a real risk when a manifest from a different,
 * earlier agent is still sitting in `cwd` (e.g. testing several agents from
 * the same folder). Ask before publishing over it so stale content isn't
 * shipped without the user noticing.
 */
async function ensureNoStaleManifest(cwd: string, silent: boolean): Promise<void> {
  const { manifestJsonPath, manifestZipPath } = getManifestPaths(cwd);
  const manifestFolder = dirname(manifestJsonPath);
  if (!existsSync(manifestJsonPath) && !existsSync(manifestZipPath)) return;

  if (silent || !isInteractive()) {
    // Can't prompt; default to regenerating so JSON/CI runs never silently
    // ship a stale manifest from an unrelated agent.
    rmSync(manifestFolder, { recursive: true, force: true });
    return;
  }

  const action = await select({
    message: `A manifest already exists at ${manifestFolder} (from a previous publish).`,
    choices: [
      { name: 'Overwrite it (regenerate for this agent)', value: 'overwrite' },
      { name: "Cancel (I'll publish from a different folder)", value: 'cancel' },
    ],
  });

  if (action === 'cancel') {
    throw new CliError(
      'AGENT_MANIFEST_EXISTS',
      'Publish cancelled: an existing manifest would have been reused.',
      `Re-run \`teams agent publish\` from a different/empty folder, or delete ${manifestFolder} first.`
    );
  }

  rmSync(manifestFolder, { recursive: true, force: true });
}

/**
 * Packages the manifest for publish. Shared by the standalone `publish`
 * command and the post-create wizard in `teams agent create`. `nameArg` is
 * only needed when publishing from a folder without a config file written
 * by `a365 setup all`; the post-create wizard never passes it, since it
 * always runs in the folder `setup all` just wrote the config into.
 */
export async function runAgentPublish(
  options: AgentPublishOptions,
  cwd: string = process.cwd(),
  nameArg?: string
): Promise<AgentPublishOutput> {
  const silent = !!options.json;

  await assertA365CliAvailable();
  const agentName = await resolveAgentName(nameArg, cwd, silent);
  await ensureNoStaleManifest(cwd, silent);

  await withAgentProgress(
    {
      start: 'Packaging agent for publish...',
      success: 'Agent package created.',
      error: 'Agent publish failed.',
    },
    silent,
    (onOutput) => runA365Publish({ cwd, agentName, onOutput })
  );

  const { manifestJsonPath, manifestZipPath } = assertManifestPublished(cwd);

  const generatedConfigPath = getGeneratedConfigPath(cwd);
  const agentBlueprintId = existsSync(generatedConfigPath)
    ? readGeneratedConfig(cwd).agentBlueprintId
    : tryReadBlueprintIdFromManifest(manifestJsonPath);

  return {
    ...(agentBlueprintId ? { agentBlueprintId } : {}),
    manifestJsonPath,
    manifestZipPath,
    ...(existsSync(generatedConfigPath) ? { generatedConfigPath } : {}),
    ...(agentBlueprintId && isDevApiEnabled()
      ? { developerPortalConfigUrl: buildDeveloperPortalConfigUrl(agentBlueprintId) }
      : {}),
    adminCenterUploadUrl: M365_ADMIN_CENTER_AGENTS_URL,
  };
}

export async function renderAgentPublishResult(output: AgentPublishOutput): Promise<void> {
  logger.info('');
  if (output.agentBlueprintId) {
    logger.info(`${pc.dim('Agent blueprint ID:')} ${output.agentBlueprintId}`);
  }
  logger.info(`${pc.dim('Manifest package:')} ${output.manifestZipPath}`);
  logger.info('');

  if (!isInteractive()) {
    logger.info(pc.bold('To finish setup:'));
    logger.info(
      `  1. Upload ${pc.cyan(output.manifestZipPath)} via ${pc.dim('Agents > All agents > Add agent > Upload manifest')}, then select the agent blueprint and choose ${pc.dim('Add instance')} to create the Agentic User ${pc.dim('→')} ${pc.cyan(output.adminCenterUploadUrl)}`
    );
    if (output.developerPortalConfigUrl) {
      logger.info(
        `  2. Set the messaging endpoint for this blueprint in Teams Developer Portal ${pc.dim('→')} ${pc.cyan(output.developerPortalConfigUrl)}`
      );
    }
    return;
  }

  // Remember the last choice so re-prompting after opening a link keeps the
  // cursor on it, instead of resetting to the top of the list each time.
  let lastAction: 'admin' | 'portal' | 'done' = 'admin';

  try {
    while (true) {
      const action: 'admin' | 'portal' | 'done' = await select<'admin' | 'portal' | 'done'>({
        message: 'To finish setup:',
        default: lastAction,
        choices: [
          {
            name: `1. Upload ${output.manifestZipPath} via Agents > All agents > Add agent > Upload manifest, then select the agent blueprint and choose Add instance to create the Agentic User`,
            value: 'admin',
          },
          ...(output.developerPortalConfigUrl
            ? [{ name: '2. Set the messaging endpoint for this blueprint in Teams Developer Portal', value: 'portal' as const }]
            : []),
          { name: 'Done', value: 'done' },
        ],
      });
      lastAction = action;
      if (action === 'done') break;
      if (action === 'admin') await openInBrowser(output.adminCenterUploadUrl);
      if (action === 'portal' && output.developerPortalConfigUrl) await openInBrowser(output.developerPortalConfigUrl);
    }
  } catch (error) {
    if (!(error instanceof Error && error.name === 'ExitPromptError')) throw error;
  }
}

export const agentPublishCommand = new Command('publish')
  .description('Package an Agent 365 blueprint for upload to the Microsoft 365 admin center')
  .argument('[name]', '[OPTIONAL] Agent name; only needed if this folder has no a365 config file')
  .option('--json', '[OPTIONAL] Output as JSON')
  .action(
    wrapAction(async (name: string | undefined, options: AgentPublishOptions) => {
      await requireAgentAccount();
      const output = await runAgentPublish(options, process.cwd(), name);

      if (options.json) {
        outputJson(output);
        return;
      }

      await renderAgentPublishResult(output);
    })
  );
