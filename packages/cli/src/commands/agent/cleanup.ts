import { Command } from 'commander';
import pc from 'picocolors';
import { runA365Cleanup } from '../../apps/agent365.js';
import { wrapAction } from '../../utils/errors.js';
import { confirmAction } from '../../utils/interactive.js';
import { outputJson } from '../../utils/json-output.js';
import { logger } from '../../utils/logger.js';
import { assertA365CliAvailable, requireAgentAccount, resolveAgentName, withAgentProgress } from './shared.js';

export interface AgentCleanupOptions {
  json?: boolean;
  dryRun?: boolean;
}

export interface AgentCleanupOutput {
  agentName?: string;
  dryRun: boolean;
}

/**
 * Removes ALL Agent 365 resources for an agent (Entra ID blueprint +
 * service principal, instance identity/user, and Azure resources). `nameArg`
 * is only needed when cleaning up from a folder without a config file
 * written by `a365 setup all`.
 */
export async function runAgentCleanup(
  nameArg: string | undefined,
  options: AgentCleanupOptions,
  cwd: string = process.cwd()
): Promise<AgentCleanupOutput> {
  const silent = !!options.json;

  await assertA365CliAvailable();
  const agentName = await resolveAgentName(nameArg, cwd, silent);

  await withAgentProgress(
    {
      start: options.dryRun ? 'Checking what would be cleaned up...' : 'Cleaning up agent resources...',
      success: options.dryRun ? 'Dry run complete.' : 'Agent resources removed.',
      error: 'Agent cleanup failed.',
    },
    silent,
    (onOutput) => runA365Cleanup({ agentName, dryRun: options.dryRun, cwd, onOutput })
  );

  return {
    ...(agentName ? { agentName } : {}),
    dryRun: !!options.dryRun,
  };
}

export function renderAgentCleanupResult(output: AgentCleanupOutput): void {
  if (output.dryRun) {
    logger.info(pc.dim('\nNo changes were made (dry run).'));
  }
}

export const agentCleanupCommand = new Command('cleanup')
  .description('Remove all Agent 365 resources for an agent (blueprint, instance, Azure)')
  .argument('[name]', '[OPTIONAL] Agent name; only needed if this folder has no a365 config file')
  .option('--json', '[OPTIONAL] Output as JSON')
  .option('--dry-run', '[OPTIONAL] Show resources that would be deleted without making any changes')
  .action(
    wrapAction(async (name: string | undefined, options: AgentCleanupOptions) => {
      await requireAgentAccount();

      if (!options.dryRun) {
        const proceed = await confirmAction(
          'This permanently deletes the agent blueprint, instance, and Azure resources. Continue?',
          !!options.json
        );
        if (!proceed) return;
      }

      const output = await runAgentCleanup(name, options, process.cwd());

      if (options.json) {
        outputJson(output);
        return;
      }
      renderAgentCleanupResult(output);
    })
  );
