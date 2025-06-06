# Teams

This page lists all the `/teams` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/teams` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/team?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## TeamsClient Endpoints

The TeamsClient instance gives access to the following `/teams` endpoints. You can get a `TeamsClient` instance like so:

```typescript
const teamsClient = graphClient.teams;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List teams | `GET /teams` | `await teamsClient.list(params);` |
| Create team | `POST /teams` | `await teamsClient.create(params);` |
| Get team | `GET /teams/{team-id}` | `await teamsClient.get({"team-id": teamId  });` |
| Delete entity from teams | `DELETE /teams/{team-id}` | `await teamsClient.delete({"team-id": teamId  });` |
| Update team | `PATCH /teams/{team-id}` | `await teamsClient.update(params);` |

## AllChannelsClient Endpoints

The AllChannelsClient instance gives access to the following `/teams/{team-id}/allChannels` endpoints. You can get a `AllChannelsClient` instance like so:

```typescript
const allChannelsClient = await teamsClient.allChannels(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List allChannels | `GET /teams/{team-id}/allChannels` | `await allChannelsClient.list(params);` |
| Get allChannels from teams | `GET /teams/{team-id}/allChannels/{channel-id}` | `await allChannelsClient.get({"channel-id": channelId  });` |

## ChannelsClient Endpoints

The ChannelsClient instance gives access to the following `/teams/{team-id}/channels` endpoints. You can get a `ChannelsClient` instance like so:

```typescript
const channelsClient = await teamsClient.channels(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List channels | `GET /teams/{team-id}/channels` | `await channelsClient.list(params);` |
| Create channel | `POST /teams/{team-id}/channels` | `await channelsClient.create(params);` |
| Get channel | `GET /teams/{team-id}/channels/{channel-id}` | `await channelsClient.get({"channel-id": channelId  });` |
| Delete channel | `DELETE /teams/{team-id}/channels/{channel-id}` | `await channelsClient.delete({"channel-id": channelId  });` |
| Patch channel | `PATCH /teams/{team-id}/channels/{channel-id}` | `await channelsClient.update(params);` |

## FilesFolderClient Endpoints

The FilesFolderClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/filesFolder` endpoints. You can get a `FilesFolderClient` instance like so:

```typescript
const filesFolderClient = await channelsClient.filesFolder(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get filesFolder | `GET /teams/{team-id}/channels/{channel-id}/filesFolder` | `await filesFolderClient.list(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/filesFolder/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = filesFolderClient.content;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property filesFolder from teams | `GET /teams/{team-id}/channels/{channel-id}/filesFolder/content` | `await contentClient.list(params);` |
| Update content for the navigation property filesFolder in teams | `PUT /teams/{team-id}/channels/{channel-id}/filesFolder/content` | `await contentClient.set(body, {"":   });` |
| Delete content for the navigation property filesFolder in teams | `DELETE /teams/{team-id}/channels/{channel-id}/filesFolder/content` | `await contentClient.delete({"":   });` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = await channelsClient.members(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List members of a channel | `GET /teams/{team-id}/channels/{channel-id}/members` | `await membersClient.list(params);` |
| Add member to channel | `POST /teams/{team-id}/channels/{channel-id}/members` | `await membersClient.create(params);` |
| Get member of channel | `GET /teams/{team-id}/channels/{channel-id}/members/{conversationMember-id}` | `await membersClient.get({"conversationMember-id": conversationMemberId  });` |
| Remove member from channel | `DELETE /teams/{team-id}/channels/{channel-id}/members/{conversationMember-id}` | `await membersClient.delete({"conversationMember-id": conversationMemberId  });` |
| Update conversationMember | `PATCH /teams/{team-id}/channels/{channel-id}/members/{conversationMember-id}` | `await membersClient.update(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/members/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = membersClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /teams/{team-id}/channels/{channel-id}/members/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/members/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = membersClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /teams/{team-id}/channels/{channel-id}/members/remove` | `await removeClient.create(params);` |

## MessagesClient Endpoints

The MessagesClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages` endpoints. You can get a `MessagesClient` instance like so:

```typescript
const messagesClient = await channelsClient.messages(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List channel messages | `GET /teams/{team-id}/channels/{channel-id}/messages` | `await messagesClient.list(params);` |
| Send chatMessage in channel | `POST /teams/{team-id}/channels/{channel-id}/messages` | `await messagesClient.create(params);` |
| Get chatMessage in a channel or chat | `GET /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | `await messagesClient.get({"chatMessage-id": chatMessageId  });` |
| Delete navigation property messages for teams | `DELETE /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | `await messagesClient.delete({"chatMessage-id": chatMessageId  });` |
| Update chatMessage | `PATCH /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}` | `await messagesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await messagesClient.hostedContents(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List hostedContents | `GET /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for teams | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from teams | `GET /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for teams | `DELETE /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in teams | `PATCH /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await messagesClient.setReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await messagesClient.softDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await messagesClient.undoSoftDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await messagesClient.unsetReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/unsetReaction` | `await unsetReactionClient.create(params);` |

## RepliesClient Endpoints

The RepliesClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies` endpoints. You can get a `RepliesClient` instance like so:

```typescript
const repliesClient = await messagesClient.replies(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List replies | `GET /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies` | `await repliesClient.list(params);` |
| Send replies to a message in a channel | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies` | `await repliesClient.create(params);` |
| Get chatMessage in a channel or chat | `GET /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.get({"chatMessage-id1": chatMessageId1  });` |
| Delete navigation property replies for teams | `DELETE /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.delete({"chatMessage-id1": chatMessageId1  });` |
| Update the navigation property replies in teams | `PATCH /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await repliesClient.hostedContents(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List hostedContents | `GET /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for teams | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from teams | `GET /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for teams | `DELETE /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in teams | `PATCH /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await repliesClient.setReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await repliesClient.softDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await repliesClient.undoSoftDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await repliesClient.unsetReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /teams/{team-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` | `await unsetReactionClient.create(params);` |

## ArchiveClient Endpoints

The ArchiveClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/archive` endpoints. You can get a `ArchiveClient` instance like so:

```typescript
const archiveClient = await channelsClient.archive(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action archive | `POST /teams/{team-id}/channels/{channel-id}/archive` | `await archiveClient.create(params);` |

## CompleteMigrationClient Endpoints

The CompleteMigrationClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/completeMigration` endpoints. You can get a `CompleteMigrationClient` instance like so:

```typescript
const completeMigrationClient = await channelsClient.completeMigration(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action completeMigration | `POST /teams/{team-id}/channels/{channel-id}/completeMigration` | `await completeMigrationClient.create(params);` |

## ProvisionEmailClient Endpoints

The ProvisionEmailClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/provisionEmail` endpoints. You can get a `ProvisionEmailClient` instance like so:

```typescript
const provisionEmailClient = await channelsClient.provisionEmail(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action provisionEmail | `POST /teams/{team-id}/channels/{channel-id}/provisionEmail` | `await provisionEmailClient.create(params);` |

## RemoveEmailClient Endpoints

The RemoveEmailClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/removeEmail` endpoints. You can get a `RemoveEmailClient` instance like so:

```typescript
const removeEmailClient = await channelsClient.removeEmail(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action removeEmail | `POST /teams/{team-id}/channels/{channel-id}/removeEmail` | `await removeEmailClient.create(params);` |

## UnarchiveClient Endpoints

The UnarchiveClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/unarchive` endpoints. You can get a `UnarchiveClient` instance like so:

```typescript
const unarchiveClient = await channelsClient.unarchive(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unarchive | `POST /teams/{team-id}/channels/{channel-id}/unarchive` | `await unarchiveClient.create(params);` |

## SharedWithTeamsClient Endpoints

The SharedWithTeamsClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/sharedWithTeams` endpoints. You can get a `SharedWithTeamsClient` instance like so:

```typescript
const sharedWithTeamsClient = await channelsClient.sharedWithTeams(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List sharedWithChannelTeamInfo | `GET /teams/{team-id}/channels/{channel-id}/sharedWithTeams` | `await sharedWithTeamsClient.list(params);` |
| Create new navigation property to sharedWithTeams for teams | `POST /teams/{team-id}/channels/{channel-id}/sharedWithTeams` | `await sharedWithTeamsClient.create(params);` |
| Get sharedWithChannelTeamInfo | `GET /teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.get({"sharedWithChannelTeamInfo-id": sharedWithChannelTeamInfoId  });` |
| Delete sharedWithChannelTeamInfo | `DELETE /teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.delete({"sharedWithChannelTeamInfo-id": sharedWithChannelTeamInfoId  });` |
| Update the navigation property sharedWithTeams in teams | `PATCH /teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.update(params);` |

## AllowedMembersClient Endpoints

The AllowedMembersClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers` endpoints. You can get a `AllowedMembersClient` instance like so:

```typescript
const allowedMembersClient = await sharedWithTeamsClient.allowedMembers(sharedWithChannelTeamInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List allowedMembers | `GET /teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers` | `await allowedMembersClient.list(params);` |
| Get allowedMembers from teams | `GET /teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers/{conversationMember-id}` | `await allowedMembersClient.get({"conversationMember-id": conversationMemberId  });` |

## TeamClient Endpoints

The TeamClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/team` endpoints. You can get a `TeamClient` instance like so:

```typescript
const teamClient = await sharedWithTeamsClient.team(sharedWithChannelTeamInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get team from teams | `GET /teams/{team-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/team` | `await teamClient.list(params);` |

## TabsClient Endpoints

The TabsClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/tabs` endpoints. You can get a `TabsClient` instance like so:

```typescript
const tabsClient = await channelsClient.tabs(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List tabs in channel | `GET /teams/{team-id}/channels/{channel-id}/tabs` | `await tabsClient.list(params);` |
| Add tab to channel | `POST /teams/{team-id}/channels/{channel-id}/tabs` | `await tabsClient.create(params);` |
| Get tab | `GET /teams/{team-id}/channels/{channel-id}/tabs/{teamsTab-id}` | `await tabsClient.get({"teamsTab-id": teamsTabId  });` |
| Delete tab from channel | `DELETE /teams/{team-id}/channels/{channel-id}/tabs/{teamsTab-id}` | `await tabsClient.delete({"teamsTab-id": teamsTabId  });` |
| Update tab | `PATCH /teams/{team-id}/channels/{channel-id}/tabs/{teamsTab-id}` | `await tabsClient.update(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/teams/{team-id}/channels/{channel-id}/tabs/{teamsTab-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await tabsClient.teamsApp(teamsTabId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from teams | `GET /teams/{team-id}/channels/{channel-id}/tabs/{teamsTab-id}/teamsApp` | `await teamsAppClient.list(params);` |

## GroupClient Endpoints

The GroupClient instance gives access to the following `/teams/{team-id}/group` endpoints. You can get a `GroupClient` instance like so:

```typescript
const groupClient = await teamsClient.group(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get group from teams | `GET /teams/{team-id}/group` | `await groupClient.list(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/teams/{team-id}/group/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = groupClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /teams/{team-id}/group/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## IncomingChannelsClient Endpoints

The IncomingChannelsClient instance gives access to the following `/teams/{team-id}/incomingChannels` endpoints. You can get a `IncomingChannelsClient` instance like so:

```typescript
const incomingChannelsClient = await teamsClient.incomingChannels(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List incomingChannels | `GET /teams/{team-id}/incomingChannels` | `await incomingChannelsClient.list(params);` |
| Get incomingChannels from teams | `GET /teams/{team-id}/incomingChannels/{channel-id}` | `await incomingChannelsClient.get({"channel-id": channelId  });` |

## InstalledAppsClient Endpoints

The InstalledAppsClient instance gives access to the following `/teams/{team-id}/installedApps` endpoints. You can get a `InstalledAppsClient` instance like so:

```typescript
const installedAppsClient = await teamsClient.installedApps(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List apps in team | `GET /teams/{team-id}/installedApps` | `await installedAppsClient.list(params);` |
| Add app to team | `POST /teams/{team-id}/installedApps` | `await installedAppsClient.create(params);` |
| Get installed app in team | `GET /teams/{team-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.get({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Remove app from team | `DELETE /teams/{team-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.delete({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Update the navigation property installedApps in teams | `PATCH /teams/{team-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.update(params);` |

## UpgradeClient Endpoints

The UpgradeClient instance gives access to the following `/teams/{team-id}/installedApps/{teamsAppInstallation-id}/upgrade` endpoints. You can get a `UpgradeClient` instance like so:

```typescript
const upgradeClient = await installedAppsClient.upgrade(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action upgrade | `POST /teams/{team-id}/installedApps/{teamsAppInstallation-id}/upgrade` | `await upgradeClient.create(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/teams/{team-id}/installedApps/{teamsAppInstallation-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await installedAppsClient.teamsApp(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from teams | `GET /teams/{team-id}/installedApps/{teamsAppInstallation-id}/teamsApp` | `await teamsAppClient.list(params);` |

## TeamsAppDefinitionClient Endpoints

The TeamsAppDefinitionClient instance gives access to the following `/teams/{team-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` endpoints. You can get a `TeamsAppDefinitionClient` instance like so:

```typescript
const teamsAppDefinitionClient = await installedAppsClient.teamsAppDefinition(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsAppDefinition from teams | `GET /teams/{team-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` | `await teamsAppDefinitionClient.list(params);` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/teams/{team-id}/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = await teamsClient.members(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List members of team | `GET /teams/{team-id}/members` | `await membersClient.list(params);` |
| Add member to team | `POST /teams/{team-id}/members` | `await membersClient.create(params);` |
| Get member of team | `GET /teams/{team-id}/members/{conversationMember-id}` | `await membersClient.get({"conversationMember-id": conversationMemberId  });` |
| Remove member from team | `DELETE /teams/{team-id}/members/{conversationMember-id}` | `await membersClient.delete({"conversationMember-id": conversationMemberId  });` |
| Update member in team | `PATCH /teams/{team-id}/members/{conversationMember-id}` | `await membersClient.update(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/teams/{team-id}/members/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = membersClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /teams/{team-id}/members/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/teams/{team-id}/members/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = membersClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /teams/{team-id}/members/remove` | `await removeClient.create(params);` |

## ArchiveClient Endpoints

The ArchiveClient instance gives access to the following `/teams/{team-id}/archive` endpoints. You can get a `ArchiveClient` instance like so:

```typescript
const archiveClient = await teamsClient.archive(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action archive | `POST /teams/{team-id}/archive` | `await archiveClient.create(params);` |

## CloneClient Endpoints

The CloneClient instance gives access to the following `/teams/{team-id}/clone` endpoints. You can get a `CloneClient` instance like so:

```typescript
const cloneClient = await teamsClient.clone(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action clone | `POST /teams/{team-id}/clone` | `await cloneClient.create(params);` |

## CompleteMigrationClient Endpoints

The CompleteMigrationClient instance gives access to the following `/teams/{team-id}/completeMigration` endpoints. You can get a `CompleteMigrationClient` instance like so:

```typescript
const completeMigrationClient = await teamsClient.completeMigration(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action completeMigration | `POST /teams/{team-id}/completeMigration` | `await completeMigrationClient.create(params);` |

## SendActivityNotificationClient Endpoints

The SendActivityNotificationClient instance gives access to the following `/teams/{team-id}/sendActivityNotification` endpoints. You can get a `SendActivityNotificationClient` instance like so:

```typescript
const sendActivityNotificationClient = await teamsClient.sendActivityNotification(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendActivityNotification | `POST /teams/{team-id}/sendActivityNotification` | `await sendActivityNotificationClient.create(params);` |

## UnarchiveClient Endpoints

The UnarchiveClient instance gives access to the following `/teams/{team-id}/unarchive` endpoints. You can get a `UnarchiveClient` instance like so:

```typescript
const unarchiveClient = await teamsClient.unarchive(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unarchive | `POST /teams/{team-id}/unarchive` | `await unarchiveClient.create(params);` |

## OperationsClient Endpoints

The OperationsClient instance gives access to the following `/teams/{team-id}/operations` endpoints. You can get a `OperationsClient` instance like so:

```typescript
const operationsClient = await teamsClient.operations(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get operations from teams | `GET /teams/{team-id}/operations` | `await operationsClient.list(params);` |
| Create new navigation property to operations for teams | `POST /teams/{team-id}/operations` | `await operationsClient.create(params);` |
| Get operations from teams | `GET /teams/{team-id}/operations/{teamsAsyncOperation-id}` | `await operationsClient.get({"teamsAsyncOperation-id": teamsAsyncOperationId  });` |
| Delete navigation property operations for teams | `DELETE /teams/{team-id}/operations/{teamsAsyncOperation-id}` | `await operationsClient.delete({"teamsAsyncOperation-id": teamsAsyncOperationId  });` |
| Update the navigation property operations in teams | `PATCH /teams/{team-id}/operations/{teamsAsyncOperation-id}` | `await operationsClient.update(params);` |

## PermissionGrantsClient Endpoints

The PermissionGrantsClient instance gives access to the following `/teams/{team-id}/permissionGrants` endpoints. You can get a `PermissionGrantsClient` instance like so:

```typescript
const permissionGrantsClient = await teamsClient.permissionGrants(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List permissionGrants of a team | `GET /teams/{team-id}/permissionGrants` | `await permissionGrantsClient.list(params);` |
| Create new navigation property to permissionGrants for teams | `POST /teams/{team-id}/permissionGrants` | `await permissionGrantsClient.create(params);` |
| Get permissionGrants from teams | `GET /teams/{team-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.get({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Delete navigation property permissionGrants for teams | `DELETE /teams/{team-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.delete({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Update the navigation property permissionGrants in teams | `PATCH /teams/{team-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.update(params);` |

## PhotoClient Endpoints

The PhotoClient instance gives access to the following `/teams/{team-id}/photo` endpoints. You can get a `PhotoClient` instance like so:

```typescript
const photoClient = await teamsClient.photo(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get profilePhoto | `GET /teams/{team-id}/photo` | `await photoClient.list(params);` |
| Update profilePhoto | `PATCH /teams/{team-id}/photo` | `await photoClient.update(params);` |

## PrimaryChannelClient Endpoints

The PrimaryChannelClient instance gives access to the following `/teams/{team-id}/primaryChannel` endpoints. You can get a `PrimaryChannelClient` instance like so:

```typescript
const primaryChannelClient = await teamsClient.primaryChannel(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get primaryChannel | `GET /teams/{team-id}/primaryChannel` | `await primaryChannelClient.list(params);` |
| Delete navigation property primaryChannel for teams | `DELETE /teams/{team-id}/primaryChannel` | `await primaryChannelClient.delete({"team-id": teamId  });` |
| Update the navigation property primaryChannel in teams | `PATCH /teams/{team-id}/primaryChannel` | `await primaryChannelClient.update(params);` |

## FilesFolderClient Endpoints

The FilesFolderClient instance gives access to the following `/teams/{team-id}/primaryChannel/filesFolder` endpoints. You can get a `FilesFolderClient` instance like so:

```typescript
const filesFolderClient = primaryChannelClient.filesFolder;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get filesFolder from teams | `GET /teams/{team-id}/primaryChannel/filesFolder` | `await filesFolderClient.list(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/teams/{team-id}/primaryChannel/filesFolder/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = filesFolderClient.content;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property filesFolder from teams | `GET /teams/{team-id}/primaryChannel/filesFolder/content` | `await contentClient.list(params);` |
| Update content for the navigation property filesFolder in teams | `PUT /teams/{team-id}/primaryChannel/filesFolder/content` | `await contentClient.set(body, {"":   });` |
| Delete content for the navigation property filesFolder in teams | `DELETE /teams/{team-id}/primaryChannel/filesFolder/content` | `await contentClient.delete({"":   });` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/teams/{team-id}/primaryChannel/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = primaryChannelClient.members;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get members from teams | `GET /teams/{team-id}/primaryChannel/members` | `await membersClient.list(params);` |
| Create new navigation property to members for teams | `POST /teams/{team-id}/primaryChannel/members` | `await membersClient.create(params);` |
| Get members from teams | `GET /teams/{team-id}/primaryChannel/members/{conversationMember-id}` | `await membersClient.get({"conversationMember-id": conversationMemberId  });` |
| Delete navigation property members for teams | `DELETE /teams/{team-id}/primaryChannel/members/{conversationMember-id}` | `await membersClient.delete({"conversationMember-id": conversationMemberId  });` |
| Update the navigation property members in teams | `PATCH /teams/{team-id}/primaryChannel/members/{conversationMember-id}` | `await membersClient.update(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/teams/{team-id}/primaryChannel/members/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = membersClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /teams/{team-id}/primaryChannel/members/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/teams/{team-id}/primaryChannel/members/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = membersClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /teams/{team-id}/primaryChannel/members/remove` | `await removeClient.create(params);` |

## MessagesClient Endpoints

The MessagesClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages` endpoints. You can get a `MessagesClient` instance like so:

```typescript
const messagesClient = primaryChannelClient.messages;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get messages from teams | `GET /teams/{team-id}/primaryChannel/messages` | `await messagesClient.list(params);` |
| Create new navigation property to messages for teams | `POST /teams/{team-id}/primaryChannel/messages` | `await messagesClient.create(params);` |
| Get messages from teams | `GET /teams/{team-id}/primaryChannel/messages/{chatMessage-id}` | `await messagesClient.get({"chatMessage-id": chatMessageId  });` |
| Delete navigation property messages for teams | `DELETE /teams/{team-id}/primaryChannel/messages/{chatMessage-id}` | `await messagesClient.delete({"chatMessage-id": chatMessageId  });` |
| Update the navigation property messages in teams | `PATCH /teams/{team-id}/primaryChannel/messages/{chatMessage-id}` | `await messagesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await messagesClient.hostedContents(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from teams | `GET /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for teams | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from teams | `GET /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for teams | `DELETE /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in teams | `PATCH /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await messagesClient.setReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await messagesClient.softDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await messagesClient.undoSoftDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await messagesClient.unsetReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/unsetReaction` | `await unsetReactionClient.create(params);` |

## RepliesClient Endpoints

The RepliesClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies` endpoints. You can get a `RepliesClient` instance like so:

```typescript
const repliesClient = await messagesClient.replies(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get replies from teams | `GET /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies` | `await repliesClient.list(params);` |
| Create new navigation property to replies for teams | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies` | `await repliesClient.create(params);` |
| Get replies from teams | `GET /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.get({"chatMessage-id1": chatMessageId1  });` |
| Delete navigation property replies for teams | `DELETE /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.delete({"chatMessage-id1": chatMessageId1  });` |
| Update the navigation property replies in teams | `PATCH /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await repliesClient.hostedContents(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from teams | `GET /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for teams | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from teams | `GET /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for teams | `DELETE /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in teams | `PATCH /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await repliesClient.setReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await repliesClient.softDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await repliesClient.undoSoftDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await repliesClient.unsetReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /teams/{team-id}/primaryChannel/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` | `await unsetReactionClient.create(params);` |

## ArchiveClient Endpoints

The ArchiveClient instance gives access to the following `/teams/{team-id}/primaryChannel/archive` endpoints. You can get a `ArchiveClient` instance like so:

```typescript
const archiveClient = primaryChannelClient.archive;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action archive | `POST /teams/{team-id}/primaryChannel/archive` | `await archiveClient.create(params);` |

## CompleteMigrationClient Endpoints

The CompleteMigrationClient instance gives access to the following `/teams/{team-id}/primaryChannel/completeMigration` endpoints. You can get a `CompleteMigrationClient` instance like so:

```typescript
const completeMigrationClient = primaryChannelClient.completeMigration;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action completeMigration | `POST /teams/{team-id}/primaryChannel/completeMigration` | `await completeMigrationClient.create(params);` |

## ProvisionEmailClient Endpoints

The ProvisionEmailClient instance gives access to the following `/teams/{team-id}/primaryChannel/provisionEmail` endpoints. You can get a `ProvisionEmailClient` instance like so:

```typescript
const provisionEmailClient = primaryChannelClient.provisionEmail;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action provisionEmail | `POST /teams/{team-id}/primaryChannel/provisionEmail` | `await provisionEmailClient.create(params);` |

## RemoveEmailClient Endpoints

The RemoveEmailClient instance gives access to the following `/teams/{team-id}/primaryChannel/removeEmail` endpoints. You can get a `RemoveEmailClient` instance like so:

```typescript
const removeEmailClient = primaryChannelClient.removeEmail;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action removeEmail | `POST /teams/{team-id}/primaryChannel/removeEmail` | `await removeEmailClient.create(params);` |

## UnarchiveClient Endpoints

The UnarchiveClient instance gives access to the following `/teams/{team-id}/primaryChannel/unarchive` endpoints. You can get a `UnarchiveClient` instance like so:

```typescript
const unarchiveClient = primaryChannelClient.unarchive;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unarchive | `POST /teams/{team-id}/primaryChannel/unarchive` | `await unarchiveClient.create(params);` |

## SharedWithTeamsClient Endpoints

The SharedWithTeamsClient instance gives access to the following `/teams/{team-id}/primaryChannel/sharedWithTeams` endpoints. You can get a `SharedWithTeamsClient` instance like so:

```typescript
const sharedWithTeamsClient = primaryChannelClient.sharedWithTeams;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sharedWithTeams from teams | `GET /teams/{team-id}/primaryChannel/sharedWithTeams` | `await sharedWithTeamsClient.list(params);` |
| Create new navigation property to sharedWithTeams for teams | `POST /teams/{team-id}/primaryChannel/sharedWithTeams` | `await sharedWithTeamsClient.create(params);` |
| Get sharedWithTeams from teams | `GET /teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.get({"sharedWithChannelTeamInfo-id": sharedWithChannelTeamInfoId  });` |
| Delete navigation property sharedWithTeams for teams | `DELETE /teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.delete({"sharedWithChannelTeamInfo-id": sharedWithChannelTeamInfoId  });` |
| Update the navigation property sharedWithTeams in teams | `PATCH /teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.update(params);` |

## AllowedMembersClient Endpoints

The AllowedMembersClient instance gives access to the following `/teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers` endpoints. You can get a `AllowedMembersClient` instance like so:

```typescript
const allowedMembersClient = await sharedWithTeamsClient.allowedMembers(sharedWithChannelTeamInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get allowedMembers from teams | `GET /teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers` | `await allowedMembersClient.list(params);` |
| Get allowedMembers from teams | `GET /teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers/{conversationMember-id}` | `await allowedMembersClient.get({"conversationMember-id": conversationMemberId  });` |

## TeamClient Endpoints

The TeamClient instance gives access to the following `/teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}/team` endpoints. You can get a `TeamClient` instance like so:

```typescript
const teamClient = await sharedWithTeamsClient.team(sharedWithChannelTeamInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get team from teams | `GET /teams/{team-id}/primaryChannel/sharedWithTeams/{sharedWithChannelTeamInfo-id}/team` | `await teamClient.list(params);` |

## TabsClient Endpoints

The TabsClient instance gives access to the following `/teams/{team-id}/primaryChannel/tabs` endpoints. You can get a `TabsClient` instance like so:

```typescript
const tabsClient = primaryChannelClient.tabs;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get tabs from teams | `GET /teams/{team-id}/primaryChannel/tabs` | `await tabsClient.list(params);` |
| Create new navigation property to tabs for teams | `POST /teams/{team-id}/primaryChannel/tabs` | `await tabsClient.create(params);` |
| Get tabs from teams | `GET /teams/{team-id}/primaryChannel/tabs/{teamsTab-id}` | `await tabsClient.get({"teamsTab-id": teamsTabId  });` |
| Delete navigation property tabs for teams | `DELETE /teams/{team-id}/primaryChannel/tabs/{teamsTab-id}` | `await tabsClient.delete({"teamsTab-id": teamsTabId  });` |
| Update the navigation property tabs in teams | `PATCH /teams/{team-id}/primaryChannel/tabs/{teamsTab-id}` | `await tabsClient.update(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/teams/{team-id}/primaryChannel/tabs/{teamsTab-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await tabsClient.teamsApp(teamsTabId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from teams | `GET /teams/{team-id}/primaryChannel/tabs/{teamsTab-id}/teamsApp` | `await teamsAppClient.list(params);` |

## ScheduleClient Endpoints

The ScheduleClient instance gives access to the following `/teams/{team-id}/schedule` endpoints. You can get a `ScheduleClient` instance like so:

```typescript
const scheduleClient = await teamsClient.schedule(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get schedule | `GET /teams/{team-id}/schedule` | `await scheduleClient.list(params);` |
| Create or replace schedule | `PUT /teams/{team-id}/schedule` | `await scheduleClient.set(body, {"team-id": teamId  });` |
| Delete navigation property schedule for teams | `DELETE /teams/{team-id}/schedule` | `await scheduleClient.delete({"team-id": teamId  });` |

## ShareClient Endpoints

The ShareClient instance gives access to the following `/teams/{team-id}/schedule/share` endpoints. You can get a `ShareClient` instance like so:

```typescript
const shareClient = scheduleClient.share;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action share | `POST /teams/{team-id}/schedule/share` | `await shareClient.create(params);` |

## OfferShiftRequestsClient Endpoints

The OfferShiftRequestsClient instance gives access to the following `/teams/{team-id}/schedule/offerShiftRequests` endpoints. You can get a `OfferShiftRequestsClient` instance like so:

```typescript
const offerShiftRequestsClient = scheduleClient.offerShiftRequests;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List offerShiftRequest | `GET /teams/{team-id}/schedule/offerShiftRequests` | `await offerShiftRequestsClient.list(params);` |
| Create offerShiftRequest | `POST /teams/{team-id}/schedule/offerShiftRequests` | `await offerShiftRequestsClient.create(params);` |
| Get offerShiftRequest | `GET /teams/{team-id}/schedule/offerShiftRequests/{offerShiftRequest-id}` | `await offerShiftRequestsClient.get({"offerShiftRequest-id": offerShiftRequestId  });` |
| Delete navigation property offerShiftRequests for teams | `DELETE /teams/{team-id}/schedule/offerShiftRequests/{offerShiftRequest-id}` | `await offerShiftRequestsClient.delete({"offerShiftRequest-id": offerShiftRequestId  });` |
| Update the navigation property offerShiftRequests in teams | `PATCH /teams/{team-id}/schedule/offerShiftRequests/{offerShiftRequest-id}` | `await offerShiftRequestsClient.update(params);` |

## OpenShiftChangeRequestsClient Endpoints

The OpenShiftChangeRequestsClient instance gives access to the following `/teams/{team-id}/schedule/openShiftChangeRequests` endpoints. You can get a `OpenShiftChangeRequestsClient` instance like so:

```typescript
const openShiftChangeRequestsClient = scheduleClient.openShiftChangeRequests;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List openShiftChangeRequests | `GET /teams/{team-id}/schedule/openShiftChangeRequests` | `await openShiftChangeRequestsClient.list(params);` |
| Create openShiftChangeRequest | `POST /teams/{team-id}/schedule/openShiftChangeRequests` | `await openShiftChangeRequestsClient.create(params);` |
| Get openShiftChangeRequest | `GET /teams/{team-id}/schedule/openShiftChangeRequests/{openShiftChangeRequest-id}` | `await openShiftChangeRequestsClient.get({"openShiftChangeRequest-id": openShiftChangeRequestId  });` |
| Delete navigation property openShiftChangeRequests for teams | `DELETE /teams/{team-id}/schedule/openShiftChangeRequests/{openShiftChangeRequest-id}` | `await openShiftChangeRequestsClient.delete({"openShiftChangeRequest-id": openShiftChangeRequestId  });` |
| Update the navigation property openShiftChangeRequests in teams | `PATCH /teams/{team-id}/schedule/openShiftChangeRequests/{openShiftChangeRequest-id}` | `await openShiftChangeRequestsClient.update(params);` |

## OpenShiftsClient Endpoints

The OpenShiftsClient instance gives access to the following `/teams/{team-id}/schedule/openShifts` endpoints. You can get a `OpenShiftsClient` instance like so:

```typescript
const openShiftsClient = scheduleClient.openShifts;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List openShifts | `GET /teams/{team-id}/schedule/openShifts` | `await openShiftsClient.list(params);` |
| Create openShift | `POST /teams/{team-id}/schedule/openShifts` | `await openShiftsClient.create(params);` |
| Get openShift | `GET /teams/{team-id}/schedule/openShifts/{openShift-id}` | `await openShiftsClient.get({"openShift-id": openShiftId  });` |
| Delete openShift | `DELETE /teams/{team-id}/schedule/openShifts/{openShift-id}` | `await openShiftsClient.delete({"openShift-id": openShiftId  });` |
| Update openShift | `PATCH /teams/{team-id}/schedule/openShifts/{openShift-id}` | `await openShiftsClient.update(params);` |

## SchedulingGroupsClient Endpoints

The SchedulingGroupsClient instance gives access to the following `/teams/{team-id}/schedule/schedulingGroups` endpoints. You can get a `SchedulingGroupsClient` instance like so:

```typescript
const schedulingGroupsClient = scheduleClient.schedulingGroups;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List scheduleGroups | `GET /teams/{team-id}/schedule/schedulingGroups` | `await schedulingGroupsClient.list(params);` |
| Create schedulingGroup | `POST /teams/{team-id}/schedule/schedulingGroups` | `await schedulingGroupsClient.create(params);` |
| Get schedulingGroup | `GET /teams/{team-id}/schedule/schedulingGroups/{schedulingGroup-id}` | `await schedulingGroupsClient.get({"schedulingGroup-id": schedulingGroupId  });` |
| Delete schedulingGroup | `DELETE /teams/{team-id}/schedule/schedulingGroups/{schedulingGroup-id}` | `await schedulingGroupsClient.delete({"schedulingGroup-id": schedulingGroupId  });` |
| Replace schedulingGroup | `PATCH /teams/{team-id}/schedule/schedulingGroups/{schedulingGroup-id}` | `await schedulingGroupsClient.update(params);` |

## ShiftsClient Endpoints

The ShiftsClient instance gives access to the following `/teams/{team-id}/schedule/shifts` endpoints. You can get a `ShiftsClient` instance like so:

```typescript
const shiftsClient = scheduleClient.shifts;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List shifts | `GET /teams/{team-id}/schedule/shifts` | `await shiftsClient.list(params);` |
| Create shift | `POST /teams/{team-id}/schedule/shifts` | `await shiftsClient.create(params);` |
| Get shift | `GET /teams/{team-id}/schedule/shifts/{shift-id}` | `await shiftsClient.get({"shift-id": shiftId  });` |
| Delete shift | `DELETE /teams/{team-id}/schedule/shifts/{shift-id}` | `await shiftsClient.delete({"shift-id": shiftId  });` |
| Replace shift | `PATCH /teams/{team-id}/schedule/shifts/{shift-id}` | `await shiftsClient.update(params);` |

## SwapShiftsChangeRequestsClient Endpoints

The SwapShiftsChangeRequestsClient instance gives access to the following `/teams/{team-id}/schedule/swapShiftsChangeRequests` endpoints. You can get a `SwapShiftsChangeRequestsClient` instance like so:

```typescript
const swapShiftsChangeRequestsClient = scheduleClient.swapShiftsChangeRequests;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List swapShiftsChangeRequest | `GET /teams/{team-id}/schedule/swapShiftsChangeRequests` | `await swapShiftsChangeRequestsClient.list(params);` |
| Create swapShiftsChangeRequest | `POST /teams/{team-id}/schedule/swapShiftsChangeRequests` | `await swapShiftsChangeRequestsClient.create(params);` |
| Get swapShiftsChangeRequest | `GET /teams/{team-id}/schedule/swapShiftsChangeRequests/{swapShiftsChangeRequest-id}` | `await swapShiftsChangeRequestsClient.get({"swapShiftsChangeRequest-id": swapShiftsChangeRequestId  });` |
| Delete navigation property swapShiftsChangeRequests for teams | `DELETE /teams/{team-id}/schedule/swapShiftsChangeRequests/{swapShiftsChangeRequest-id}` | `await swapShiftsChangeRequestsClient.delete({"swapShiftsChangeRequest-id": swapShiftsChangeRequestId  });` |
| Update the navigation property swapShiftsChangeRequests in teams | `PATCH /teams/{team-id}/schedule/swapShiftsChangeRequests/{swapShiftsChangeRequest-id}` | `await swapShiftsChangeRequestsClient.update(params);` |

## TimeOffReasonsClient Endpoints

The TimeOffReasonsClient instance gives access to the following `/teams/{team-id}/schedule/timeOffReasons` endpoints. You can get a `TimeOffReasonsClient` instance like so:

```typescript
const timeOffReasonsClient = scheduleClient.timeOffReasons;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List timeOffReasons | `GET /teams/{team-id}/schedule/timeOffReasons` | `await timeOffReasonsClient.list(params);` |
| Create timeOffReason | `POST /teams/{team-id}/schedule/timeOffReasons` | `await timeOffReasonsClient.create(params);` |
| Get timeOffReason | `GET /teams/{team-id}/schedule/timeOffReasons/{timeOffReason-id}` | `await timeOffReasonsClient.get({"timeOffReason-id": timeOffReasonId  });` |
| Delete timeOffReason | `DELETE /teams/{team-id}/schedule/timeOffReasons/{timeOffReason-id}` | `await timeOffReasonsClient.delete({"timeOffReason-id": timeOffReasonId  });` |
| Replace timeOffReason | `PATCH /teams/{team-id}/schedule/timeOffReasons/{timeOffReason-id}` | `await timeOffReasonsClient.update(params);` |

## TimeOffRequestsClient Endpoints

The TimeOffRequestsClient instance gives access to the following `/teams/{team-id}/schedule/timeOffRequests` endpoints. You can get a `TimeOffRequestsClient` instance like so:

```typescript
const timeOffRequestsClient = scheduleClient.timeOffRequests;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List timeOffRequest | `GET /teams/{team-id}/schedule/timeOffRequests` | `await timeOffRequestsClient.list(params);` |
| Create new navigation property to timeOffRequests for teams | `POST /teams/{team-id}/schedule/timeOffRequests` | `await timeOffRequestsClient.create(params);` |
| Get timeOffRequest | `GET /teams/{team-id}/schedule/timeOffRequests/{timeOffRequest-id}` | `await timeOffRequestsClient.get({"timeOffRequest-id": timeOffRequestId  });` |
| Delete timeOffRequest | `DELETE /teams/{team-id}/schedule/timeOffRequests/{timeOffRequest-id}` | `await timeOffRequestsClient.delete({"timeOffRequest-id": timeOffRequestId  });` |
| Update the navigation property timeOffRequests in teams | `PATCH /teams/{team-id}/schedule/timeOffRequests/{timeOffRequest-id}` | `await timeOffRequestsClient.update(params);` |

## TimesOffClient Endpoints

The TimesOffClient instance gives access to the following `/teams/{team-id}/schedule/timesOff` endpoints. You can get a `TimesOffClient` instance like so:

```typescript
const timesOffClient = scheduleClient.timesOff;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List timesOff | `GET /teams/{team-id}/schedule/timesOff` | `await timesOffClient.list(params);` |
| Create timeOff | `POST /teams/{team-id}/schedule/timesOff` | `await timesOffClient.create(params);` |
| Get timeOff | `GET /teams/{team-id}/schedule/timesOff/{timeOff-id}` | `await timesOffClient.get({"timeOff-id": timeOffId  });` |
| Delete timeOff | `DELETE /teams/{team-id}/schedule/timesOff/{timeOff-id}` | `await timesOffClient.delete({"timeOff-id": timeOffId  });` |
| Replace timeOff | `PATCH /teams/{team-id}/schedule/timesOff/{timeOff-id}` | `await timesOffClient.update(params);` |

## TagsClient Endpoints

The TagsClient instance gives access to the following `/teams/{team-id}/tags` endpoints. You can get a `TagsClient` instance like so:

```typescript
const tagsClient = await teamsClient.tags(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List teamworkTags | `GET /teams/{team-id}/tags` | `await tagsClient.list(params);` |
| Create teamworkTag | `POST /teams/{team-id}/tags` | `await tagsClient.create(params);` |
| Get teamworkTag | `GET /teams/{team-id}/tags/{teamworkTag-id}` | `await tagsClient.get({"teamworkTag-id": teamworkTagId  });` |
| Delete teamworkTag | `DELETE /teams/{team-id}/tags/{teamworkTag-id}` | `await tagsClient.delete({"teamworkTag-id": teamworkTagId  });` |
| Update teamworkTag | `PATCH /teams/{team-id}/tags/{teamworkTag-id}` | `await tagsClient.update(params);` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/teams/{team-id}/tags/{teamworkTag-id}/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = await tagsClient.members(teamworkTagId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List members in a teamworkTag | `GET /teams/{team-id}/tags/{teamworkTag-id}/members` | `await membersClient.list(params);` |
| Create teamworkTagMember | `POST /teams/{team-id}/tags/{teamworkTag-id}/members` | `await membersClient.create(params);` |
| Get teamworkTagMember | `GET /teams/{team-id}/tags/{teamworkTag-id}/members/{teamworkTagMember-id}` | `await membersClient.get({"teamworkTagMember-id": teamworkTagMemberId  });` |
| Delete teamworkTagMember | `DELETE /teams/{team-id}/tags/{teamworkTag-id}/members/{teamworkTagMember-id}` | `await membersClient.delete({"teamworkTagMember-id": teamworkTagMemberId  });` |
| Update the navigation property members in teams | `PATCH /teams/{team-id}/tags/{teamworkTag-id}/members/{teamworkTagMember-id}` | `await membersClient.update(params);` |

## TemplateClient Endpoints

The TemplateClient instance gives access to the following `/teams/{team-id}/template` endpoints. You can get a `TemplateClient` instance like so:

```typescript
const templateClient = await teamsClient.template(teamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get template from teams | `GET /teams/{team-id}/template` | `await templateClient.list(params);` |
