# Teamwork

This page lists all the `/teamwork` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/teamwork` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/teamwork?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## TeamworkClient Endpoints

The TeamworkClient instance gives access to the following `/teamwork` endpoints. You can get a `TeamworkClient` instance like so:

```typescript
const teamworkClient = graphClient.teamwork;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamwork | `GET /teamwork` | `await teamworkClient.list(params);` |
| Update teamwork | `PATCH /teamwork` | `await teamworkClient.update(params);` |

## DeletedChatsClient Endpoints

The DeletedChatsClient instance gives access to the following `/teamwork/deletedChats` endpoints. You can get a `DeletedChatsClient` instance like so:

```typescript
const deletedChatsClient = teamworkClient.deletedChats;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get deletedChat | `GET /teamwork/deletedChats` | `await deletedChatsClient.list(params);` |
| Create new navigation property to deletedChats for teamwork | `POST /teamwork/deletedChats` | `await deletedChatsClient.create(params);` |
| Get deletedChat | `GET /teamwork/deletedChats/{deletedChat-id}` | `await deletedChatsClient.get({"deletedChat-id": deletedChatId  });` |
| Delete navigation property deletedChats for teamwork | `DELETE /teamwork/deletedChats/{deletedChat-id}` | `await deletedChatsClient.delete({"deletedChat-id": deletedChatId  });` |
| Update the navigation property deletedChats in teamwork | `PATCH /teamwork/deletedChats/{deletedChat-id}` | `await deletedChatsClient.update(params);` |

## UndoDeleteClient Endpoints

The UndoDeleteClient instance gives access to the following `/teamwork/deletedChats/{deletedChat-id}/undoDelete` endpoints. You can get a `UndoDeleteClient` instance like so:

```typescript
const undoDeleteClient = await deletedChatsClient.undoDelete(deletedChatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoDelete | `POST /teamwork/deletedChats/{deletedChat-id}/undoDelete` | `await undoDeleteClient.create(params);` |

## DeletedTeamsClient Endpoints

The DeletedTeamsClient instance gives access to the following `/teamwork/deletedTeams` endpoints. You can get a `DeletedTeamsClient` instance like so:

```typescript
const deletedTeamsClient = teamworkClient.deletedTeams;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List deletedTeams | `GET /teamwork/deletedTeams` | `await deletedTeamsClient.list(params);` |
| Create new navigation property to deletedTeams for teamwork | `POST /teamwork/deletedTeams` | `await deletedTeamsClient.create(params);` |
| Get deletedTeams from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}` | `await deletedTeamsClient.get({"deletedTeam-id": deletedTeamId  });` |
| Delete navigation property deletedTeams for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}` | `await deletedTeamsClient.delete({"deletedTeam-id": deletedTeamId  });` |
| Update the navigation property deletedTeams in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}` | `await deletedTeamsClient.update(params);` |

## ChannelsClient Endpoints

The ChannelsClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels` endpoints. You can get a `ChannelsClient` instance like so:

```typescript
const channelsClient = await deletedTeamsClient.channels(deletedTeamId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get channels from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels` | `await channelsClient.list(params);` |
| Create new navigation property to channels for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels` | `await channelsClient.create(params);` |
| Get channels from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}` | `await channelsClient.get({"channel-id": channelId  });` |
| Delete navigation property channels for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}` | `await channelsClient.delete({"channel-id": channelId  });` |
| Update the navigation property channels in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}` | `await channelsClient.update(params);` |

## FilesFolderClient Endpoints

The FilesFolderClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/filesFolder` endpoints. You can get a `FilesFolderClient` instance like so:

```typescript
const filesFolderClient = await channelsClient.filesFolder(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get filesFolder from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/filesFolder` | `await filesFolderClient.list(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/filesFolder/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = filesFolderClient.content;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property filesFolder from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/filesFolder/content` | `await contentClient.list(params);` |
| Update content for the navigation property filesFolder in teamwork | `PUT /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/filesFolder/content` | `await contentClient.set(body, {"":   });` |
| Delete content for the navigation property filesFolder in teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/filesFolder/content` | `await contentClient.delete({"":   });` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = await channelsClient.members(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get members from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members` | `await membersClient.list(params);` |
| Create new navigation property to members for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members` | `await membersClient.create(params);` |
| Get members from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members/{conversationMember-id}` | `await membersClient.get({"conversationMember-id": conversationMemberId  });` |
| Delete navigation property members for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members/{conversationMember-id}` | `await membersClient.delete({"conversationMember-id": conversationMemberId  });` |
| Update the navigation property members in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members/{conversationMember-id}` | `await membersClient.update(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = membersClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = membersClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/members/remove` | `await removeClient.create(params);` |

## MessagesClient Endpoints

The MessagesClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages` endpoints. You can get a `MessagesClient` instance like so:

```typescript
const messagesClient = await channelsClient.messages(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get messages from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages` | `await messagesClient.list(params);` |
| Create new navigation property to messages for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages` | `await messagesClient.create(params);` |
| Get messages from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}` | `await messagesClient.get({"chatMessage-id": chatMessageId  });` |
| Delete navigation property messages for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}` | `await messagesClient.delete({"chatMessage-id": chatMessageId  });` |
| Update the navigation property messages in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}` | `await messagesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await messagesClient.hostedContents(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await messagesClient.setReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await messagesClient.softDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await messagesClient.undoSoftDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await messagesClient.unsetReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/unsetReaction` | `await unsetReactionClient.create(params);` |

## RepliesClient Endpoints

The RepliesClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies` endpoints. You can get a `RepliesClient` instance like so:

```typescript
const repliesClient = await messagesClient.replies(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get replies from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies` | `await repliesClient.list(params);` |
| Create new navigation property to replies for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies` | `await repliesClient.create(params);` |
| Get replies from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.get({"chatMessage-id1": chatMessageId1  });` |
| Delete navigation property replies for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.delete({"chatMessage-id1": chatMessageId1  });` |
| Update the navigation property replies in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await repliesClient.hostedContents(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await repliesClient.setReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await repliesClient.softDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await repliesClient.undoSoftDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await repliesClient.unsetReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` | `await unsetReactionClient.create(params);` |

## ArchiveClient Endpoints

The ArchiveClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/archive` endpoints. You can get a `ArchiveClient` instance like so:

```typescript
const archiveClient = await channelsClient.archive(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action archive | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/archive` | `await archiveClient.create(params);` |

## CompleteMigrationClient Endpoints

The CompleteMigrationClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/completeMigration` endpoints. You can get a `CompleteMigrationClient` instance like so:

```typescript
const completeMigrationClient = await channelsClient.completeMigration(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action completeMigration | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/completeMigration` | `await completeMigrationClient.create(params);` |

## ProvisionEmailClient Endpoints

The ProvisionEmailClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/provisionEmail` endpoints. You can get a `ProvisionEmailClient` instance like so:

```typescript
const provisionEmailClient = await channelsClient.provisionEmail(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action provisionEmail | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/provisionEmail` | `await provisionEmailClient.create(params);` |

## RemoveEmailClient Endpoints

The RemoveEmailClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/removeEmail` endpoints. You can get a `RemoveEmailClient` instance like so:

```typescript
const removeEmailClient = await channelsClient.removeEmail(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action removeEmail | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/removeEmail` | `await removeEmailClient.create(params);` |

## UnarchiveClient Endpoints

The UnarchiveClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/unarchive` endpoints. You can get a `UnarchiveClient` instance like so:

```typescript
const unarchiveClient = await channelsClient.unarchive(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unarchive | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/unarchive` | `await unarchiveClient.create(params);` |

## SharedWithTeamsClient Endpoints

The SharedWithTeamsClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams` endpoints. You can get a `SharedWithTeamsClient` instance like so:

```typescript
const sharedWithTeamsClient = await channelsClient.sharedWithTeams(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sharedWithTeams from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams` | `await sharedWithTeamsClient.list(params);` |
| Create new navigation property to sharedWithTeams for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams` | `await sharedWithTeamsClient.create(params);` |
| Get sharedWithTeams from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.get({"sharedWithChannelTeamInfo-id": sharedWithChannelTeamInfoId  });` |
| Delete navigation property sharedWithTeams for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.delete({"sharedWithChannelTeamInfo-id": sharedWithChannelTeamInfoId  });` |
| Update the navigation property sharedWithTeams in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}` | `await sharedWithTeamsClient.update(params);` |

## AllowedMembersClient Endpoints

The AllowedMembersClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers` endpoints. You can get a `AllowedMembersClient` instance like so:

```typescript
const allowedMembersClient = await sharedWithTeamsClient.allowedMembers(sharedWithChannelTeamInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get allowedMembers from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers` | `await allowedMembersClient.list(params);` |
| Get allowedMembers from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/allowedMembers/{conversationMember-id}` | `await allowedMembersClient.get({"conversationMember-id": conversationMemberId  });` |

## TeamClient Endpoints

The TeamClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/team` endpoints. You can get a `TeamClient` instance like so:

```typescript
const teamClient = await sharedWithTeamsClient.team(sharedWithChannelTeamInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get team from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/sharedWithTeams/{sharedWithChannelTeamInfo-id}/team` | `await teamClient.list(params);` |

## TabsClient Endpoints

The TabsClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs` endpoints. You can get a `TabsClient` instance like so:

```typescript
const tabsClient = await channelsClient.tabs(channelId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get tabs from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs` | `await tabsClient.list(params);` |
| Create new navigation property to tabs for teamwork | `POST /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs` | `await tabsClient.create(params);` |
| Get tabs from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs/{teamsTab-id}` | `await tabsClient.get({"teamsTab-id": teamsTabId  });` |
| Delete navigation property tabs for teamwork | `DELETE /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs/{teamsTab-id}` | `await tabsClient.delete({"teamsTab-id": teamsTabId  });` |
| Update the navigation property tabs in teamwork | `PATCH /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs/{teamsTab-id}` | `await tabsClient.update(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs/{teamsTab-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await tabsClient.teamsApp(teamsTabId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from teamwork | `GET /teamwork/deletedTeams/{deletedTeam-id}/channels/{channel-id}/tabs/{teamsTab-id}/teamsApp` | `await teamsAppClient.list(params);` |

## SendActivityNotificationToRecipientsClient Endpoints

The SendActivityNotificationToRecipientsClient instance gives access to the following `/teamwork/sendActivityNotificationToRecipients` endpoints. You can get a `SendActivityNotificationToRecipientsClient` instance like so:

```typescript
const sendActivityNotificationToRecipientsClient = teamworkClient.sendActivityNotificationToRecipients;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendActivityNotificationToRecipients | `POST /teamwork/sendActivityNotificationToRecipients` | `await sendActivityNotificationToRecipientsClient.create(params);` |

## TeamsAppSettingsClient Endpoints

The TeamsAppSettingsClient instance gives access to the following `/teamwork/teamsAppSettings` endpoints. You can get a `TeamsAppSettingsClient` instance like so:

```typescript
const teamsAppSettingsClient = teamworkClient.teamsAppSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsAppSettings | `GET /teamwork/teamsAppSettings` | `await teamsAppSettingsClient.list(params);` |
| Delete navigation property teamsAppSettings for teamwork | `DELETE /teamwork/teamsAppSettings` | `await teamsAppSettingsClient.delete({"":   });` |
| Update teamsAppSettings | `PATCH /teamwork/teamsAppSettings` | `await teamsAppSettingsClient.update(params);` |

## WorkforceIntegrationsClient Endpoints

The WorkforceIntegrationsClient instance gives access to the following `/teamwork/workforceIntegrations` endpoints. You can get a `WorkforceIntegrationsClient` instance like so:

```typescript
const workforceIntegrationsClient = teamworkClient.workforceIntegrations;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List workforceIntegrations | `GET /teamwork/workforceIntegrations` | `await workforceIntegrationsClient.list(params);` |
| Create workforceIntegration | `POST /teamwork/workforceIntegrations` | `await workforceIntegrationsClient.create(params);` |
| Get workforceIntegration | `GET /teamwork/workforceIntegrations/{workforceIntegration-id}` | `await workforceIntegrationsClient.get({"workforceIntegration-id": workforceIntegrationId  });` |
| Delete workforceIntegration | `DELETE /teamwork/workforceIntegrations/{workforceIntegration-id}` | `await workforceIntegrationsClient.delete({"workforceIntegration-id": workforceIntegrationId  });` |
| Update workforceIntegration | `PATCH /teamwork/workforceIntegrations/{workforceIntegration-id}` | `await workforceIntegrationsClient.update(params);` |
