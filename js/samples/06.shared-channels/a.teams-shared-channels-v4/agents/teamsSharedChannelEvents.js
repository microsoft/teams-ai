// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
  TeamsActivityHandler,
  CardFactory,
  ActivityTypes
} = require('botbuilder');

/**
 * TeamsSharedChannelEvents class extends TeamsActivityHandler
 * and provides functionality to interact with Microsoft Teams,
 * including listening for shared channel events.
 */
class TeamsSharedChannelEvents extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      await context.sendActivity("The Agent is listening for shared channel related events...");

      await next();
    });

    this.onConversationUpdate(async (context, next) => {
      if (this.isChannelSharedWithTeam(context)) {
        await this.onChannelSharedWithTeam(context);
      } else if (this.isChannelUnsharedWithTeam(context)) {
        await this.onChannelUnsharedWithTeam(context);
      } else if (this.isSharedChannelAllowed(context)) {
        await this.onSharedChannelAllowed(context);
      } else if (this.isSharedChannelDisallowed(context)) {
        await this.onSharedChannelDisallowed(context);
      } else if (this.isSharedChannelRenamed(context)) {
        await this.onSharedChannelRenamed(context);
      } else if (this.isSharedChannelDeleted(context)) {
        await this.onSharedChannelDeleted(context);
      } else if (this.isSharedChannelRestored(context)) {
        await this.onSharedChannelRestored(context);
      } else if (this.isSharedChannelMemberAdded(context)) {
        await this.onSharedChannelMemberAdded(context);
      } else if (this.isSharedChannelMemberRemoved(context)) {
        await this.onSharedChannelMemberRemoved(context);
      }

      await next();
    });
  }

  async onChannelSharedWithTeam(context) {
    const channelData = context.activity.channelData;
    const sharedWithTeams = channelData.sharedWithTeams || [];
    const host = channelData.team ?? {};
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Host Team ID': host.id || 'N/A',
      'Host Team Name': host.name || 'N/A',
      'Host AAD Group ID': host.aadGroupId || 'N/A',
      'Host Tenant ID': host.tenantId || 'N/A'
    }
    const headers = ['Team ID', 'Team Name', 'AAD Group ID', 'Tenant ID'];
    const items = sharedWithTeams.map(team => [
      team.id || 'N/A',
      team.name || 'N/A',
      team.aadGroupId || 'N/A',
      team.tenantId || 'N/A'
    ]);
    await this.sendCard(context, 'Channel Shared With Teams', facts, headers, items);
  }

  async onChannelUnsharedWithTeam(context) {
    const channelData = context.activity.channelData;
    const unsharedFromTeams = channelData.unsharedFromTeams || [];
    const host = channelData.team ?? {};
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Host Team ID': host.id || 'N/A',
      'Host Team Name': host.name || 'N/A',
      'Host AAD Group ID': host.aadGroupId || 'N/A',
      'Host Tenant ID': host.tenantId || 'N/A'
    }
    const headers = ['Team ID', 'Team Name', 'AAD Group ID', 'Tenant ID'];
    const items = unsharedFromTeams.map(team => [
      team.id || 'N/A',
      team.name || 'N/A',
      team.aadGroupId || 'N/A',
      team.tenantId || 'N/A'
    ]);
    await this.sendCard(context, 'Channel Unshared From Teams', facts, headers, items);
  }

  async onSharedChannelAllowed(context) {
    const channelData = context.activity.channelData;
    const membersAdded = context.activity.membersAdded || [];
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Channel ID': channelData.channel?.id || 'N/A'
    }
    const headers = ['ID', 'Name', 'Role'];
    const items = membersAdded.map(member => [
      member.id || 'N/A',
      member.name || 'N/A',
      member.role || 'N/A'
    ]);
    await this.sendCard(context, 'Agent Allowed for Shared Channel', facts, headers, items);
  }

  async onSharedChannelDisallowed(context) {
    const channelData = context.activity.channelData;
    const membersRemoved = context.activity.membersRemoved || [];
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Channel ID': channelData.channel?.id || 'N/A'
    }
    const headers = ['ID', 'Name', 'Role'];
    const items = membersRemoved.map(member => [
      member.id || 'N/A',
      member.name || 'N/A',
      member.role || 'N/A'
    ]);
    await this.sendCard(context, 'Agent Disallowed for Shared Channel', facts, headers, items);
  }

  async onSharedChannelRenamed(context) {
    const channelData = context.activity.channelData;
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Channel ID': channelData.channel?.id || 'N/A'
    }
    await this.sendCard(context, 'Shared Channel Renamed', facts, null, null);
  }

  async onSharedChannelDeleted(context) {
    const channelData = context.activity.channelData;
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Channel ID': channelData.channel?.id || 'N/A'
    }
    await this.sendCard(context, 'Shared Channel Deleted', facts, null, null);
  }

  async onSharedChannelRestored(context) {
    const channelData = context.activity.channelData;
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Channel ID': channelData.channel?.id || 'N/A'
    }
    await this.sendCard(context, 'Shared Channel Restored', facts, null, null);
  }

  async onSharedChannelMemberAdded(context) {
    const channelData = context.activity.channelData;
    const membersAdded = context.activity.membersAdded || [];
    const membershipSource = channelData.membershipSource || {};
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Channel ID': channelData.channel?.id || 'N/A',
      'Membership Source Type': membershipSource.sourceType || 'N/A',
      'Membership Source ID': membershipSource.id || 'N/A',
      'Membership Type': membershipSource.membershipType || 'N/A',
      'Membership Team Group ID': membershipSource.teamGroupId || 'N/A',
      'Membership Tenant ID': membershipSource.tenantId || 'N/A'
    }
    const headers = ['ID', 'Name', 'Role'];
    const items = membersAdded.map(member => [
      member.id || 'N/A',
      member.name || 'N/A',
      member.role || 'N/A'
    ]);
    await this.sendCard(context, 'User Added to Shared Channel', facts, headers, items);
  }

  async onSharedChannelMemberRemoved(context) {
    const channelData = context.activity.channelData;
    const membersRemoved = context.activity.membersRemoved || [];
    const membershipSource = channelData.membershipSource || {};
    const facts = {
      'Channel Name': channelData.channel?.name || 'N/A',
      'Channel ID': channelData.channel?.id || 'N/A',
      'Membership Source Type': membershipSource.sourceType || 'N/A',
      'Membership Source ID': membershipSource.id || 'N/A',
      'Membership Type': membershipSource.membershipType || 'N/A',
      'Membership Team Group ID': membershipSource.teamGroupId || 'N/A',
      'Membership Tenant ID': membershipSource.tenantId || 'N/A'
    }
    const headers = ['ID', 'Name', 'Role'];
    const items = membersRemoved.map(member => [
      member.id || 'N/A',
      member.name || 'N/A',
      member.role || 'N/A'
    ]);
    await this.sendCard(context, 'User Removed from Shared Channel', facts, headers, items);
  }

  isChannelSharedWithTeam(context) {
    const channelData = context.activity.channelData
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      channelData &&
      channelData.eventType === 'channelShared' &&
      Array.isArray(channelData.sharedWithTeams);
  }

  isChannelUnsharedWithTeam(context) {
    const channelData = context.activity.channelData
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      channelData &&
      channelData.eventType === 'channelUnshared' &&
      Array.isArray(channelData.unsharedFromTeams);
  }

  isSharedChannelAllowed(context) {
    const channelData = context.activity.channelData;
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      channelData &&
      channelData.eventType === 'channelMemberAdded' &&
      channelData.channel &&
      channelData.channel.type === 'shared';
  }

  isSharedChannelDisallowed(context) {
    const channelData = context.activity.channelData;
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      channelData &&
      channelData.eventType === 'channelMemberRemoved' &&
      channelData.channel &&
      channelData.channel.type === 'shared';
  }

  isSharedChannelRenamed(context) {
    const channelData = context.activity.channelData;
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      channelData &&
      channelData.eventType === 'channelRenamed' &&
      channelData.channel &&
      channelData.channel.type === 'shared';
  }

  isSharedChannelDeleted(context) {
    const channelData = context.activity.channelData;
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      channelData &&
      channelData.eventType === 'channelDeleted' &&
      channelData.channel &&
      channelData.channel.type === 'shared';
  }

  isSharedChannelRestored(context) {
    const channelData = context.activity.channelData;
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      channelData &&
      channelData.eventType === 'channelRestored' &&
      channelData.channel &&
      channelData.channel.type === 'shared';
  }

  isSharedChannelMemberAdded(context) {
    const channelData = context.activity.channelData;
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      Array.isArray(context.activity.membersAdded) &&
      channelData &&
      channelData.channel &&
      channelData.channel.type === 'shared';
  }

  isSharedChannelMemberRemoved(context) {
    const channelData = context.activity.channelData;
    return context.activity.type === ActivityTypes.ConversationUpdate &&
      context.activity.channelId === 'msteams' &&
      Array.isArray(context.activity.membersRemoved) &&
      channelData &&
      channelData.channel &&
      channelData.channel.type === 'shared';
  }

  async sendCard(context, title, facts, headers, items) {
    const cardContent = {
      type: "AdaptiveCard",
      version: "1.5",
      body: [{ type: "TextBlock", text: title, weight: "Bolder", size: "Medium" }]
    };

    // Append any facts to the card
    if (facts) {
      const factSet = { type: "FactSet", facts: [] };
      for (const [key, value] of Object.entries(facts)) {
        factSet.facts.push({ title: key, value });
      }
      cardContent.body.push(factSet);
    }

    function getCell(text, weight) {
      return { type: "TableCell", items: [{ type: "TextBlock", text, wrap: true, weight: weight ?? 'Default' }] };
    }

    // Populate a table with headers and items
    if (Array.isArray(items) && items.length > 0) {
      const table = { type: "Table", columns: headers.map(header => ({ width: 1 })), rows: [] };
      table.rows.push({ type: "TableRow", cells: headers.map(header => getCell(header, "Bolder")) });
      items.forEach(item => {
        table.rows.push({ type: "TableRow", cells: item.map(cell => getCell(cell)) });
      });
      cardContent.body.push(table);
    }

    const cardAttachment = CardFactory.adaptiveCard(cardContent);
    await context.sendActivity({ attachments: [cardAttachment] });
  }
}

module.exports.TeamsSharedChannelEvents = TeamsSharedChannelEvents;


//========================================================================================
// Relevant Types
//========================================================================================

/*
// Represents data for a Teams channel.
export interface TeamsChannelData {
   // Information about the channel.
  channel?: ChannelInfo

  // The type of event.
  eventType?: string

  // Information about the team.
  team?: TeamInfo

  // Information about the notification.
  notification?: NotificationInfo

  // Information about the tenant.
  tenant?: TenantInfo

  // Information about the meeting.
  meeting?: TeamsMeetingInfo

  // Settings for the Teams channel data.
  settings?: TeamsChannelDataSettings

  // Information about the users on behalf of whom the action is performed.
  onBehalfOf?: OnBehalfOf[]

  // List of teams that a channel was shared with.
  sharedWithTeams?: TeamInfo[]

  // List of teams that a channel was unshared from.
  unsharedFromTeams?: TeamInfo[]

  // Information about the source of a member that was added or removed from a shared channel.
  membershipSource?: MembershipSource
}

// Represents information about a channel.
export interface ChannelInfo {
  // The ID of the channel.
  id?: string

  // The name of the channel.
  name?: string

  // The type of the channel.
  type?: ChannelTypes
}

// Enum representing the different Teams channel types.
export enum ChannelTypes {
  // Represents a private Teams channel.
  Private = 'private',

  // Represents a shared Teams channel.
  Shared = 'shared',

  // Represents a standard Teams channel.
  Standard = 'standard',

// Represents information about a team.
export interface TeamInfo {
  // The ID of the team.
  id?: string

  // The name of the team.
  name?: string

  // The Azure Active Directory group ID of the team.
  aadGroupId?: string

   // The tenant ID of the team.
  tenantId?: string
}

// Interface representing a membership source.
export interface MembershipSource {
  // The type of roster the user is a member of.
  sourceType: MembershipSourceTypes;

  // The unique identifier of the membership source.
  id: string

  // The users relationship to the current channel.
  membershipType: MembershipTypes;

  // The group ID of the team associated with this membership source.
  teamGroupId: string

  // Optional. The tenant ID for the user.
  tenantId?: string
}

// Enum defining the type of roster the user is a member of.
export enum MembershipSourceTypes {
  // The user is a direct member of the current channel.
  Channel = 'channel',

  // The user is a member of a team that is a member of the current channel.
  Team = 'team',
}

// Enum expressing the users relationship to the current channel.
export enum MembershipTypes {
  // The user is a direct member of a channel.
  Direct = 'direct',

  // The user is a member of a channel through a group.
  Transitive = 'transitive',
}

*/