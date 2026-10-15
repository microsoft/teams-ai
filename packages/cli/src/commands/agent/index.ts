import { Command } from 'commander';
import { agentCreateCommand } from './create.js';
import { agentUpdateEndpointCommand } from './update-endpoint.js';
import { agentUpdateIdentifierCommand } from './update-identifier.js';

export const agentCommand = new Command('agent')
  .description('Manage Microsoft Agent 365 agent identities')
  .action(function (this: Command) {
    this.help();
  });

agentCommand.addCommand(agentCreateCommand);
agentCommand.addCommand(agentUpdateEndpointCommand);
agentCommand.addCommand(agentUpdateIdentifierCommand);
