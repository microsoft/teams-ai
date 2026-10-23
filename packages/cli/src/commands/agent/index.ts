import { Command } from 'commander';
import { agentCleanupCommand } from './cleanup.js';
import { agentCreateCommand } from './create.js';
import { agentPublishCommand } from './publish.js';
import { agentUpdateEndpointCommand } from './update-endpoint.js';

export const agentCommand = new Command('agent')
  .description('Manage Microsoft Agent 365 agent identities')
  .action(function (this: Command) {
    this.help();
  });

agentCommand.addCommand(agentCreateCommand);
agentCommand.addCommand(agentUpdateEndpointCommand);
agentCommand.addCommand(agentPublishCommand);
agentCommand.addCommand(agentCleanupCommand);
