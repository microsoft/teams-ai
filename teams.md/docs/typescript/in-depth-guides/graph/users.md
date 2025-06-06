# Users

This page lists all the `/users` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/users` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/users?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## UsersClient Endpoints

The UsersClient instance gives access to the following `/users` endpoints. You can get a `UsersClient` instance like so:

```typescript
const usersClient = graphClient.users;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List users | `GET /users` | `await usersClient.list(params);` |
| Create User | `POST /users` | `await usersClient.create(params);` |
| Get user | `GET /users/{user-id}` | `await usersClient.get({"user-id": userId  });` |
| Delete user | `DELETE /users/{user-id}` | `await usersClient.delete({"user-id": userId  });` |
| Update user | `PATCH /users/{user-id}` | `await usersClient.update(params);` |

## ChatsClient Endpoints

The ChatsClient instance gives access to the following `/users/{user-id}/chats` endpoints. You can get a `ChatsClient` instance like so:

```typescript
const chatsClient = await usersClient.chats(userId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List chats | `GET /users/{user-id}/chats` | `await chatsClient.list(params);` |
| Create new navigation property to chats for users | `POST /users/{user-id}/chats` | `await chatsClient.create(params);` |
| Get chat | `GET /users/{user-id}/chats/{chat-id}` | `await chatsClient.get({"chat-id": chatId  });` |
| Delete navigation property chats for users | `DELETE /users/{user-id}/chats/{chat-id}` | `await chatsClient.delete({"chat-id": chatId  });` |
| Update the navigation property chats in users | `PATCH /users/{user-id}/chats/{chat-id}` | `await chatsClient.update(params);` |

## InstalledAppsClient Endpoints

The InstalledAppsClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/installedApps` endpoints. You can get a `InstalledAppsClient` instance like so:

```typescript
const installedAppsClient = await chatsClient.installedApps(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get installedApps from users | `GET /users/{user-id}/chats/{chat-id}/installedApps` | `await installedAppsClient.list(params);` |
| Create new navigation property to installedApps for users | `POST /users/{user-id}/chats/{chat-id}/installedApps` | `await installedAppsClient.create(params);` |
| Get installedApps from users | `GET /users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.get({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Delete navigation property installedApps for users | `DELETE /users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.delete({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Update the navigation property installedApps in users | `PATCH /users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.update(params);` |

## UpgradeClient Endpoints

The UpgradeClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/upgrade` endpoints. You can get a `UpgradeClient` instance like so:

```typescript
const upgradeClient = await installedAppsClient.upgrade(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action upgrade | `POST /users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/upgrade` | `await upgradeClient.create(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await installedAppsClient.teamsApp(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from users | `GET /users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsApp` | `await teamsAppClient.list(params);` |

## TeamsAppDefinitionClient Endpoints

The TeamsAppDefinitionClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` endpoints. You can get a `TeamsAppDefinitionClient` instance like so:

```typescript
const teamsAppDefinitionClient = await installedAppsClient.teamsAppDefinition(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsAppDefinition from users | `GET /users/{user-id}/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` | `await teamsAppDefinitionClient.list(params);` |

## LastMessagePreviewClient Endpoints

The LastMessagePreviewClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/lastMessagePreview` endpoints. You can get a `LastMessagePreviewClient` instance like so:

```typescript
const lastMessagePreviewClient = await chatsClient.lastMessagePreview(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastMessagePreview from users | `GET /users/{user-id}/chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.list(params);` |
| Delete navigation property lastMessagePreview for users | `DELETE /users/{user-id}/chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.delete({"chat-id": chatId  });` |
| Update the navigation property lastMessagePreview in users | `PATCH /users/{user-id}/chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.update(params);` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = await chatsClient.members(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get members from users | `GET /users/{user-id}/chats/{chat-id}/members` | `await membersClient.list(params);` |
| Create new navigation property to members for users | `POST /users/{user-id}/chats/{chat-id}/members` | `await membersClient.create(params);` |
| Get members from users | `GET /users/{user-id}/chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.get({"conversationMember-id": conversationMemberId  });` |
| Delete navigation property members for users | `DELETE /users/{user-id}/chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.delete({"conversationMember-id": conversationMemberId  });` |
| Update the navigation property members in users | `PATCH /users/{user-id}/chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.update(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/members/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = membersClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /users/{user-id}/chats/{chat-id}/members/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/members/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = membersClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /users/{user-id}/chats/{chat-id}/members/remove` | `await removeClient.create(params);` |

## MessagesClient Endpoints

The MessagesClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages` endpoints. You can get a `MessagesClient` instance like so:

```typescript
const messagesClient = await chatsClient.messages(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get messages from users | `GET /users/{user-id}/chats/{chat-id}/messages` | `await messagesClient.list(params);` |
| Create new navigation property to messages for users | `POST /users/{user-id}/chats/{chat-id}/messages` | `await messagesClient.create(params);` |
| Get messages from users | `GET /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.get({"chatMessage-id": chatMessageId  });` |
| Delete navigation property messages for users | `DELETE /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.delete({"chatMessage-id": chatMessageId  });` |
| Update the navigation property messages in users | `PATCH /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await messagesClient.hostedContents(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from users | `GET /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for users | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from users | `GET /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for users | `DELETE /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in users | `PATCH /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await messagesClient.setReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await messagesClient.softDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await messagesClient.undoSoftDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await messagesClient.unsetReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/unsetReaction` | `await unsetReactionClient.create(params);` |

## RepliesClient Endpoints

The RepliesClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies` endpoints. You can get a `RepliesClient` instance like so:

```typescript
const repliesClient = await messagesClient.replies(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get replies from users | `GET /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies` | `await repliesClient.list(params);` |
| Create new navigation property to replies for users | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies` | `await repliesClient.create(params);` |
| Get replies from users | `GET /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.get({"chatMessage-id1": chatMessageId1  });` |
| Delete navigation property replies for users | `DELETE /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.delete({"chatMessage-id1": chatMessageId1  });` |
| Update the navigation property replies in users | `PATCH /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await repliesClient.hostedContents(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from users | `GET /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for users | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from users | `GET /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for users | `DELETE /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in users | `PATCH /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await repliesClient.setReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await repliesClient.softDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await repliesClient.undoSoftDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await repliesClient.unsetReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /users/{user-id}/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` | `await unsetReactionClient.create(params);` |

## HideForUserClient Endpoints

The HideForUserClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/hideForUser` endpoints. You can get a `HideForUserClient` instance like so:

```typescript
const hideForUserClient = await chatsClient.hideForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action hideForUser | `POST /users/{user-id}/chats/{chat-id}/hideForUser` | `await hideForUserClient.create(params);` |

## MarkChatReadForUserClient Endpoints

The MarkChatReadForUserClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/markChatReadForUser` endpoints. You can get a `MarkChatReadForUserClient` instance like so:

```typescript
const markChatReadForUserClient = await chatsClient.markChatReadForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action markChatReadForUser | `POST /users/{user-id}/chats/{chat-id}/markChatReadForUser` | `await markChatReadForUserClient.create(params);` |

## MarkChatUnreadForUserClient Endpoints

The MarkChatUnreadForUserClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/markChatUnreadForUser` endpoints. You can get a `MarkChatUnreadForUserClient` instance like so:

```typescript
const markChatUnreadForUserClient = await chatsClient.markChatUnreadForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action markChatUnreadForUser | `POST /users/{user-id}/chats/{chat-id}/markChatUnreadForUser` | `await markChatUnreadForUserClient.create(params);` |

## SendActivityNotificationClient Endpoints

The SendActivityNotificationClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/sendActivityNotification` endpoints. You can get a `SendActivityNotificationClient` instance like so:

```typescript
const sendActivityNotificationClient = await chatsClient.sendActivityNotification(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendActivityNotification | `POST /users/{user-id}/chats/{chat-id}/sendActivityNotification` | `await sendActivityNotificationClient.create(params);` |

## UnhideForUserClient Endpoints

The UnhideForUserClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/unhideForUser` endpoints. You can get a `UnhideForUserClient` instance like so:

```typescript
const unhideForUserClient = await chatsClient.unhideForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unhideForUser | `POST /users/{user-id}/chats/{chat-id}/unhideForUser` | `await unhideForUserClient.create(params);` |

## PermissionGrantsClient Endpoints

The PermissionGrantsClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/permissionGrants` endpoints. You can get a `PermissionGrantsClient` instance like so:

```typescript
const permissionGrantsClient = await chatsClient.permissionGrants(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get permissionGrants from users | `GET /users/{user-id}/chats/{chat-id}/permissionGrants` | `await permissionGrantsClient.list(params);` |
| Create new navigation property to permissionGrants for users | `POST /users/{user-id}/chats/{chat-id}/permissionGrants` | `await permissionGrantsClient.create(params);` |
| Get permissionGrants from users | `GET /users/{user-id}/chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.get({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Delete navigation property permissionGrants for users | `DELETE /users/{user-id}/chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.delete({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Update the navigation property permissionGrants in users | `PATCH /users/{user-id}/chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.update(params);` |

## PinnedMessagesClient Endpoints

The PinnedMessagesClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/pinnedMessages` endpoints. You can get a `PinnedMessagesClient` instance like so:

```typescript
const pinnedMessagesClient = await chatsClient.pinnedMessages(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get pinnedMessages from users | `GET /users/{user-id}/chats/{chat-id}/pinnedMessages` | `await pinnedMessagesClient.list(params);` |
| Create new navigation property to pinnedMessages for users | `POST /users/{user-id}/chats/{chat-id}/pinnedMessages` | `await pinnedMessagesClient.create(params);` |
| Get pinnedMessages from users | `GET /users/{user-id}/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.get({"pinnedChatMessageInfo-id": pinnedChatMessageInfoId  });` |
| Delete navigation property pinnedMessages for users | `DELETE /users/{user-id}/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.delete({"pinnedChatMessageInfo-id": pinnedChatMessageInfoId  });` |
| Update the navigation property pinnedMessages in users | `PATCH /users/{user-id}/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.update(params);` |

## MessageClient Endpoints

The MessageClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}/message` endpoints. You can get a `MessageClient` instance like so:

```typescript
const messageClient = await pinnedMessagesClient.message(pinnedChatMessageInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get message from users | `GET /users/{user-id}/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}/message` | `await messageClient.list(params);` |

## TabsClient Endpoints

The TabsClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/tabs` endpoints. You can get a `TabsClient` instance like so:

```typescript
const tabsClient = await chatsClient.tabs(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get tabs from users | `GET /users/{user-id}/chats/{chat-id}/tabs` | `await tabsClient.list(params);` |
| Create new navigation property to tabs for users | `POST /users/{user-id}/chats/{chat-id}/tabs` | `await tabsClient.create(params);` |
| Get tabs from users | `GET /users/{user-id}/chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.get({"teamsTab-id": teamsTabId  });` |
| Delete navigation property tabs for users | `DELETE /users/{user-id}/chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.delete({"teamsTab-id": teamsTabId  });` |
| Update the navigation property tabs in users | `PATCH /users/{user-id}/chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.update(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/users/{user-id}/chats/{chat-id}/tabs/{teamsTab-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await tabsClient.teamsApp(teamsTabId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from users | `GET /users/{user-id}/chats/{chat-id}/tabs/{teamsTab-id}/teamsApp` | `await teamsAppClient.list(params);` |

## OnlineMeetingsClient Endpoints

The OnlineMeetingsClient instance gives access to the following `/users/{user-id}/onlineMeetings` endpoints. You can get a `OnlineMeetingsClient` instance like so:

```typescript
const onlineMeetingsClient = await usersClient.onlineMeetings(userId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get onlineMeetings from users | `GET /users/{user-id}/onlineMeetings` | `await onlineMeetingsClient.list(params);` |
| Create new navigation property to onlineMeetings for users | `POST /users/{user-id}/onlineMeetings` | `await onlineMeetingsClient.create(params);` |
| Get onlineMeetings from users | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}` | `await onlineMeetingsClient.get({"onlineMeeting-id": onlineMeetingId  });` |
| Delete navigation property onlineMeetings for users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}` | `await onlineMeetingsClient.delete({"onlineMeeting-id": onlineMeetingId  });` |
| Update the navigation property onlineMeetings in users | `PATCH /users/{user-id}/onlineMeetings/{onlineMeeting-id}` | `await onlineMeetingsClient.update(params);` |

## AttendanceReportsClient Endpoints

The AttendanceReportsClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports` endpoints. You can get a `AttendanceReportsClient` instance like so:

```typescript
const attendanceReportsClient = await onlineMeetingsClient.attendanceReports(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceReports from users | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports` | `await attendanceReportsClient.list(params);` |
| Create new navigation property to attendanceReports for users | `POST /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports` | `await attendanceReportsClient.create(params);` |
| Get attendanceReports from users | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.get({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Delete navigation property attendanceReports for users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.delete({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Update the navigation property attendanceReports in users | `PATCH /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.update(params);` |

## AttendanceRecordsClient Endpoints

The AttendanceRecordsClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` endpoints. You can get a `AttendanceRecordsClient` instance like so:

```typescript
const attendanceRecordsClient = await attendanceReportsClient.attendanceRecords(meetingAttendanceReportId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceRecords from users | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.list(params);` |
| Create new navigation property to attendanceRecords for users | `POST /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.create(params);` |
| Get attendanceRecords from users | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.get({"attendanceRecord-id": attendanceRecordId  });` |
| Delete navigation property attendanceRecords for users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.delete({"attendanceRecord-id": attendanceRecordId  });` |
| Update the navigation property attendanceRecords in users | `PATCH /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.update(params);` |

## AttendeeReportClient Endpoints

The AttendeeReportClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendeeReport` endpoints. You can get a `AttendeeReportClient` instance like so:

```typescript
const attendeeReportClient = await onlineMeetingsClient.attendeeReport(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendeeReport for the navigation property onlineMeetings from users | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendeeReport` | `await attendeeReportClient.list(params);` |
| Update attendeeReport for the navigation property onlineMeetings in users | `PUT /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendeeReport` | `await attendeeReportClient.set(body, {"onlineMeeting-id": onlineMeetingId  });` |
| Delete attendeeReport for the navigation property onlineMeetings in users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/attendeeReport` | `await attendeeReportClient.delete({"onlineMeeting-id": onlineMeetingId  });` |

## SendVirtualAppointmentReminderSmsClient Endpoints

The SendVirtualAppointmentReminderSmsClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentReminderSms` endpoints. You can get a `SendVirtualAppointmentReminderSmsClient` instance like so:

```typescript
const sendVirtualAppointmentReminderSmsClient = await onlineMeetingsClient.sendVirtualAppointmentReminderSms(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendVirtualAppointmentReminderSms | `POST /users/{user-id}/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentReminderSms` | `await sendVirtualAppointmentReminderSmsClient.create(params);` |

## SendVirtualAppointmentSmsClient Endpoints

The SendVirtualAppointmentSmsClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentSms` endpoints. You can get a `SendVirtualAppointmentSmsClient` instance like so:

```typescript
const sendVirtualAppointmentSmsClient = await onlineMeetingsClient.sendVirtualAppointmentSms(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendVirtualAppointmentSms | `POST /users/{user-id}/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentSms` | `await sendVirtualAppointmentSmsClient.create(params);` |

## RecordingsClient Endpoints

The RecordingsClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings` endpoints. You can get a `RecordingsClient` instance like so:

```typescript
const recordingsClient = await onlineMeetingsClient.recordings(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get callRecording | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings` | `await recordingsClient.list(params);` |
| Create new navigation property to recordings for users | `POST /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings` | `await recordingsClient.create(params);` |
| Get callRecording | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}` | `await recordingsClient.get({"callRecording-id": callRecordingId  });` |
| Delete navigation property recordings for users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}` | `await recordingsClient.delete({"callRecording-id": callRecordingId  });` |
| Update the navigation property recordings in users | `PATCH /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}` | `await recordingsClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await recordingsClient.content(callRecordingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property recordings from users | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property recordings in users | `PUT /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` | `await contentClient.set(body, {"callRecording-id": callRecordingId  });` |
| Delete content for the navigation property recordings in users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` | `await contentClient.delete({"callRecording-id": callRecordingId  });` |

## TranscriptsClient Endpoints

The TranscriptsClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts` endpoints. You can get a `TranscriptsClient` instance like so:

```typescript
const transcriptsClient = await onlineMeetingsClient.transcripts(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List transcripts | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts` | `await transcriptsClient.list(params);` |
| Create new navigation property to transcripts for users | `POST /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts` | `await transcriptsClient.create(params);` |
| Get callTranscript | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}` | `await transcriptsClient.get({"callTranscript-id": callTranscriptId  });` |
| Delete navigation property transcripts for users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}` | `await transcriptsClient.delete({"callTranscript-id": callTranscriptId  });` |
| Update the navigation property transcripts in users | `PATCH /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}` | `await transcriptsClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await transcriptsClient.content(callTranscriptId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get callTranscript | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property transcripts in users | `PUT /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` | `await contentClient.set(body, {"callTranscript-id": callTranscriptId  });` |
| Delete content for the navigation property transcripts in users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` | `await contentClient.delete({"callTranscript-id": callTranscriptId  });` |

## MetadataContentClient Endpoints

The MetadataContentClient instance gives access to the following `/users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` endpoints. You can get a `MetadataContentClient` instance like so:

```typescript
const metadataContentClient = await transcriptsClient.metadataContent(callTranscriptId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get callTranscript | `GET /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` | `await metadataContentClient.list(params);` |
| Update metadataContent for the navigation property transcripts in users | `PUT /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` | `await metadataContentClient.set(body, {"callTranscript-id": callTranscriptId  });` |
| Delete metadataContent for the navigation property transcripts in users | `DELETE /users/{user-id}/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` | `await metadataContentClient.delete({"callTranscript-id": callTranscriptId  });` |

## CreateOrGetClient Endpoints

The CreateOrGetClient instance gives access to the following `/users/{user-id}/onlineMeetings/createOrGet` endpoints. You can get a `CreateOrGetClient` instance like so:

```typescript
const createOrGetClient = onlineMeetingsClient.createOrGet;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createOrGet | `POST /users/{user-id}/onlineMeetings/createOrGet` | `await createOrGetClient.create(params);` |

## PresenceClient Endpoints

The PresenceClient instance gives access to the following `/users/{user-id}/presence` endpoints. You can get a `PresenceClient` instance like so:

```typescript
const presenceClient = await usersClient.presence(userId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get presence | `GET /users/{user-id}/presence` | `await presenceClient.list(params);` |
| Delete navigation property presence for users | `DELETE /users/{user-id}/presence` | `await presenceClient.delete({"user-id": userId  });` |
| Update the navigation property presence in users | `PATCH /users/{user-id}/presence` | `await presenceClient.update(params);` |

## ClearPresenceClient Endpoints

The ClearPresenceClient instance gives access to the following `/users/{user-id}/presence/clearPresence` endpoints. You can get a `ClearPresenceClient` instance like so:

```typescript
const clearPresenceClient = presenceClient.clearPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action clearPresence | `POST /users/{user-id}/presence/clearPresence` | `await clearPresenceClient.create(params);` |

## ClearUserPreferredPresenceClient Endpoints

The ClearUserPreferredPresenceClient instance gives access to the following `/users/{user-id}/presence/clearUserPreferredPresence` endpoints. You can get a `ClearUserPreferredPresenceClient` instance like so:

```typescript
const clearUserPreferredPresenceClient = presenceClient.clearUserPreferredPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action clearUserPreferredPresence | `POST /users/{user-id}/presence/clearUserPreferredPresence` | `await clearUserPreferredPresenceClient.create(params);` |

## SetPresenceClient Endpoints

The SetPresenceClient instance gives access to the following `/users/{user-id}/presence/setPresence` endpoints. You can get a `SetPresenceClient` instance like so:

```typescript
const setPresenceClient = presenceClient.setPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setPresence | `POST /users/{user-id}/presence/setPresence` | `await setPresenceClient.create(params);` |

## SetStatusMessageClient Endpoints

The SetStatusMessageClient instance gives access to the following `/users/{user-id}/presence/setStatusMessage` endpoints. You can get a `SetStatusMessageClient` instance like so:

```typescript
const setStatusMessageClient = presenceClient.setStatusMessage;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setStatusMessage | `POST /users/{user-id}/presence/setStatusMessage` | `await setStatusMessageClient.create(params);` |

## SetUserPreferredPresenceClient Endpoints

The SetUserPreferredPresenceClient instance gives access to the following `/users/{user-id}/presence/setUserPreferredPresence` endpoints. You can get a `SetUserPreferredPresenceClient` instance like so:

```typescript
const setUserPreferredPresenceClient = presenceClient.setUserPreferredPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setUserPreferredPresence | `POST /users/{user-id}/presence/setUserPreferredPresence` | `await setUserPreferredPresenceClient.create(params);` |

## TeamworkClient Endpoints

The TeamworkClient instance gives access to the following `/users/{user-id}/teamwork` endpoints. You can get a `TeamworkClient` instance like so:

```typescript
const teamworkClient = await usersClient.teamwork(userId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get userTeamwork | `GET /users/{user-id}/teamwork` | `await teamworkClient.list(params);` |
| Delete navigation property teamwork for users | `DELETE /users/{user-id}/teamwork` | `await teamworkClient.delete({"user-id": userId  });` |
| Update the navigation property teamwork in users | `PATCH /users/{user-id}/teamwork` | `await teamworkClient.update(params);` |

## AssociatedTeamsClient Endpoints

The AssociatedTeamsClient instance gives access to the following `/users/{user-id}/teamwork/associatedTeams` endpoints. You can get a `AssociatedTeamsClient` instance like so:

```typescript
const associatedTeamsClient = teamworkClient.associatedTeams;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get associatedTeams from users | `GET /users/{user-id}/teamwork/associatedTeams` | `await associatedTeamsClient.list(params);` |
| Create new navigation property to associatedTeams for users | `POST /users/{user-id}/teamwork/associatedTeams` | `await associatedTeamsClient.create(params);` |
| Get associatedTeams from users | `GET /users/{user-id}/teamwork/associatedTeams/{associatedTeamInfo-id}` | `await associatedTeamsClient.get({"associatedTeamInfo-id": associatedTeamInfoId  });` |
| Delete navigation property associatedTeams for users | `DELETE /users/{user-id}/teamwork/associatedTeams/{associatedTeamInfo-id}` | `await associatedTeamsClient.delete({"associatedTeamInfo-id": associatedTeamInfoId  });` |
| Update the navigation property associatedTeams in users | `PATCH /users/{user-id}/teamwork/associatedTeams/{associatedTeamInfo-id}` | `await associatedTeamsClient.update(params);` |

## TeamClient Endpoints

The TeamClient instance gives access to the following `/users/{user-id}/teamwork/associatedTeams/{associatedTeamInfo-id}/team` endpoints. You can get a `TeamClient` instance like so:

```typescript
const teamClient = await associatedTeamsClient.team(associatedTeamInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get team from users | `GET /users/{user-id}/teamwork/associatedTeams/{associatedTeamInfo-id}/team` | `await teamClient.list(params);` |

## InstalledAppsClient Endpoints

The InstalledAppsClient instance gives access to the following `/users/{user-id}/teamwork/installedApps` endpoints. You can get a `InstalledAppsClient` instance like so:

```typescript
const installedAppsClient = teamworkClient.installedApps;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List apps installed for user | `GET /users/{user-id}/teamwork/installedApps` | `await installedAppsClient.list(params);` |
| Install app for user | `POST /users/{user-id}/teamwork/installedApps` | `await installedAppsClient.create(params);` |
| Get installed app for user | `GET /users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}` | `await installedAppsClient.get({"userScopeTeamsAppInstallation-id": userScopeTeamsAppInstallationId  });` |
| Uninstall app for user | `DELETE /users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}` | `await installedAppsClient.delete({"userScopeTeamsAppInstallation-id": userScopeTeamsAppInstallationId  });` |
| Update the navigation property installedApps in users | `PATCH /users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}` | `await installedAppsClient.update(params);` |

## ChatClient Endpoints

The ChatClient instance gives access to the following `/users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}/chat` endpoints. You can get a `ChatClient` instance like so:

```typescript
const chatClient = await installedAppsClient.chat(userScopeTeamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get chat between user and teamsApp | `GET /users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}/chat` | `await chatClient.list(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await installedAppsClient.teamsApp(userScopeTeamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from users | `GET /users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}/teamsApp` | `await teamsAppClient.list(params);` |

## TeamsAppDefinitionClient Endpoints

The TeamsAppDefinitionClient instance gives access to the following `/users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}/teamsAppDefinition` endpoints. You can get a `TeamsAppDefinitionClient` instance like so:

```typescript
const teamsAppDefinitionClient = await installedAppsClient.teamsAppDefinition(userScopeTeamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsAppDefinition from users | `GET /users/{user-id}/teamwork/installedApps/{userScopeTeamsAppInstallation-id}/teamsAppDefinition` | `await teamsAppDefinitionClient.list(params);` |

## SendActivityNotificationClient Endpoints

The SendActivityNotificationClient instance gives access to the following `/users/{user-id}/teamwork/sendActivityNotification` endpoints. You can get a `SendActivityNotificationClient` instance like so:

```typescript
const sendActivityNotificationClient = teamworkClient.sendActivityNotification;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendActivityNotification | `POST /users/{user-id}/teamwork/sendActivityNotification` | `await sendActivityNotificationClient.create(params);` |
