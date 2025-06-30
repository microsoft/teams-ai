# Chats

This page lists all the `/chats` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/chats` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## ChatsClient Endpoints

The ChatsClient instance gives access to the following `/chats` endpoints. You can get a `ChatsClient` instance like so:

```typescript
const chatsClient = graphClient.chats;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List chats | `GET /chats` | `await chatsClient.list(params);` |
| Create chat | `POST /chats` | `await chatsClient.create(params);` |
| Get chat | `GET /chats/{chat-id}` | `await chatsClient.get({"chat-id": chatId  });` |
| Delete chat | `DELETE /chats/{chat-id}` | `await chatsClient.delete({"chat-id": chatId  });` |
| Update chat | `PATCH /chats/{chat-id}` | `await chatsClient.update(params);` |

## InstalledAppsClient Endpoints

The InstalledAppsClient instance gives access to the following `/chats/{chat-id}/installedApps` endpoints. You can get a `InstalledAppsClient` instance like so:

```typescript
const installedAppsClient = await chatsClient.installedApps(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List apps in chat | `GET /chats/{chat-id}/installedApps` | `await installedAppsClient.list(params);` |
| Add app to chat | `POST /chats/{chat-id}/installedApps` | `await installedAppsClient.create(params);` |
| Get installed app in chat | `GET /chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.get({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Uninstall app in a chat | `DELETE /chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.delete({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Update the navigation property installedApps in chats | `PATCH /chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.update(params);` |

## UpgradeClient Endpoints

The UpgradeClient instance gives access to the following `/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/upgrade` endpoints. You can get a `UpgradeClient` instance like so:

```typescript
const upgradeClient = await installedAppsClient.upgrade(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action upgrade | `POST /chats/{chat-id}/installedApps/{teamsAppInstallation-id}/upgrade` | `await upgradeClient.create(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await installedAppsClient.teamsApp(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from chats | `GET /chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsApp` | `await teamsAppClient.list(params);` |

## TeamsAppDefinitionClient Endpoints

The TeamsAppDefinitionClient instance gives access to the following `/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` endpoints. You can get a `TeamsAppDefinitionClient` instance like so:

```typescript
const teamsAppDefinitionClient = await installedAppsClient.teamsAppDefinition(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsAppDefinition from chats | `GET /chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` | `await teamsAppDefinitionClient.list(params);` |

## LastMessagePreviewClient Endpoints

The LastMessagePreviewClient instance gives access to the following `/chats/{chat-id}/lastMessagePreview` endpoints. You can get a `LastMessagePreviewClient` instance like so:

```typescript
const lastMessagePreviewClient = await chatsClient.lastMessagePreview(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastMessagePreview from chats | `GET /chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.list(params);` |
| Delete navigation property lastMessagePreview for chats | `DELETE /chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.delete({"chat-id": chatId  });` |
| Update the navigation property lastMessagePreview in chats | `PATCH /chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.update(params);` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/chats/{chat-id}/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = await chatsClient.members(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List conversationMembers | `GET /chats/{chat-id}/members` | `await membersClient.list(params);` |
| Add member to a chat | `POST /chats/{chat-id}/members` | `await membersClient.create(params);` |
| Get conversationMember | `GET /chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.get({"conversationMember-id": conversationMemberId  });` |
| Remove member from chat | `DELETE /chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.delete({"conversationMember-id": conversationMemberId  });` |
| Update the navigation property members in chats | `PATCH /chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.update(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/chats/{chat-id}/members/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = membersClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /chats/{chat-id}/members/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/chats/{chat-id}/members/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = membersClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /chats/{chat-id}/members/remove` | `await removeClient.create(params);` |

## MessagesClient Endpoints

The MessagesClient instance gives access to the following `/chats/{chat-id}/messages` endpoints. You can get a `MessagesClient` instance like so:

```typescript
const messagesClient = await chatsClient.messages(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List messages in a chat | `GET /chats/{chat-id}/messages` | `await messagesClient.list(params);` |
| Send chatMessage in a channel or a chat | `POST /chats/{chat-id}/messages` | `await messagesClient.create(params);` |
| Get chatMessage in a channel or chat | `GET /chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.get({"chatMessage-id": chatMessageId  });` |
| Delete navigation property messages for chats | `DELETE /chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.delete({"chatMessage-id": chatMessageId  });` |
| Update the navigation property messages in chats | `PATCH /chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await messagesClient.hostedContents(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List hostedContents | `GET /chats/{chat-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for chats | `POST /chats/{chat-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get chatMessageHostedContent | `GET /chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for chats | `DELETE /chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in chats | `PATCH /chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await messagesClient.setReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /chats/{chat-id}/messages/{chatMessage-id}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await messagesClient.softDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /chats/{chat-id}/messages/{chatMessage-id}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await messagesClient.undoSoftDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /chats/{chat-id}/messages/{chatMessage-id}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await messagesClient.unsetReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /chats/{chat-id}/messages/{chatMessage-id}/unsetReaction` | `await unsetReactionClient.create(params);` |

## RepliesClient Endpoints

The RepliesClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/replies` endpoints. You can get a `RepliesClient` instance like so:

```typescript
const repliesClient = await messagesClient.replies(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get replies from chats | `GET /chats/{chat-id}/messages/{chatMessage-id}/replies` | `await repliesClient.list(params);` |
| Create new navigation property to replies for chats | `POST /chats/{chat-id}/messages/{chatMessage-id}/replies` | `await repliesClient.create(params);` |
| Get replies from chats | `GET /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.get({"chatMessage-id1": chatMessageId1  });` |
| Delete navigation property replies for chats | `DELETE /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.delete({"chatMessage-id1": chatMessageId1  });` |
| Update the navigation property replies in chats | `PATCH /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await repliesClient.hostedContents(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from chats | `GET /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for chats | `POST /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from chats | `GET /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for chats | `DELETE /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in chats | `PATCH /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await repliesClient.setReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await repliesClient.softDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await repliesClient.undoSoftDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await repliesClient.unsetReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` | `await unsetReactionClient.create(params);` |

## HideForUserClient Endpoints

The HideForUserClient instance gives access to the following `/chats/{chat-id}/hideForUser` endpoints. You can get a `HideForUserClient` instance like so:

```typescript
const hideForUserClient = await chatsClient.hideForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action hideForUser | `POST /chats/{chat-id}/hideForUser` | `await hideForUserClient.create(params);` |

## MarkChatReadForUserClient Endpoints

The MarkChatReadForUserClient instance gives access to the following `/chats/{chat-id}/markChatReadForUser` endpoints. You can get a `MarkChatReadForUserClient` instance like so:

```typescript
const markChatReadForUserClient = await chatsClient.markChatReadForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action markChatReadForUser | `POST /chats/{chat-id}/markChatReadForUser` | `await markChatReadForUserClient.create(params);` |

## MarkChatUnreadForUserClient Endpoints

The MarkChatUnreadForUserClient instance gives access to the following `/chats/{chat-id}/markChatUnreadForUser` endpoints. You can get a `MarkChatUnreadForUserClient` instance like so:

```typescript
const markChatUnreadForUserClient = await chatsClient.markChatUnreadForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action markChatUnreadForUser | `POST /chats/{chat-id}/markChatUnreadForUser` | `await markChatUnreadForUserClient.create(params);` |

## SendActivityNotificationClient Endpoints

The SendActivityNotificationClient instance gives access to the following `/chats/{chat-id}/sendActivityNotification` endpoints. You can get a `SendActivityNotificationClient` instance like so:

```typescript
const sendActivityNotificationClient = await chatsClient.sendActivityNotification(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendActivityNotification | `POST /chats/{chat-id}/sendActivityNotification` | `await sendActivityNotificationClient.create(params);` |

## UnhideForUserClient Endpoints

The UnhideForUserClient instance gives access to the following `/chats/{chat-id}/unhideForUser` endpoints. You can get a `UnhideForUserClient` instance like so:

```typescript
const unhideForUserClient = await chatsClient.unhideForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unhideForUser | `POST /chats/{chat-id}/unhideForUser` | `await unhideForUserClient.create(params);` |

## PermissionGrantsClient Endpoints

The PermissionGrantsClient instance gives access to the following `/chats/{chat-id}/permissionGrants` endpoints. You can get a `PermissionGrantsClient` instance like so:

```typescript
const permissionGrantsClient = await chatsClient.permissionGrants(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List permissionGrants of a chat | `GET /chats/{chat-id}/permissionGrants` | `await permissionGrantsClient.list(params);` |
| Create new navigation property to permissionGrants for chats | `POST /chats/{chat-id}/permissionGrants` | `await permissionGrantsClient.create(params);` |
| Get permissionGrants from chats | `GET /chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.get({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Delete navigation property permissionGrants for chats | `DELETE /chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.delete({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Update the navigation property permissionGrants in chats | `PATCH /chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.update(params);` |

## PinnedMessagesClient Endpoints

The PinnedMessagesClient instance gives access to the following `/chats/{chat-id}/pinnedMessages` endpoints. You can get a `PinnedMessagesClient` instance like so:

```typescript
const pinnedMessagesClient = await chatsClient.pinnedMessages(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List pinnedChatMessages in a chat | `GET /chats/{chat-id}/pinnedMessages` | `await pinnedMessagesClient.list(params);` |
| Pin a message in a chat | `POST /chats/{chat-id}/pinnedMessages` | `await pinnedMessagesClient.create(params);` |
| Get pinnedMessages from chats | `GET /chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.get({"pinnedChatMessageInfo-id": pinnedChatMessageInfoId  });` |
| Unpin a message from a chat | `DELETE /chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.delete({"pinnedChatMessageInfo-id": pinnedChatMessageInfoId  });` |
| Update the navigation property pinnedMessages in chats | `PATCH /chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.update(params);` |

## MessageClient Endpoints

The MessageClient instance gives access to the following `/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}/message` endpoints. You can get a `MessageClient` instance like so:

```typescript
const messageClient = await pinnedMessagesClient.message(pinnedChatMessageInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get message from chats | `GET /chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}/message` | `await messageClient.list(params);` |

## TabsClient Endpoints

The TabsClient instance gives access to the following `/chats/{chat-id}/tabs` endpoints. You can get a `TabsClient` instance like so:

```typescript
const tabsClient = await chatsClient.tabs(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List tabs in chat | `GET /chats/{chat-id}/tabs` | `await tabsClient.list(params);` |
| Add tab to chat | `POST /chats/{chat-id}/tabs` | `await tabsClient.create(params);` |
| Get tab in chat | `GET /chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.get({"teamsTab-id": teamsTabId  });` |
| Delete tab from chat | `DELETE /chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.delete({"teamsTab-id": teamsTabId  });` |
| Update tab in chat | `PATCH /chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.update(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/chats/{chat-id}/tabs/{teamsTab-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await tabsClient.teamsApp(teamsTabId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from chats | `GET /chats/{chat-id}/tabs/{teamsTab-id}/teamsApp` | `await teamsAppClient.list(params);` |
