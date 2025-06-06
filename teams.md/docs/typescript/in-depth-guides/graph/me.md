# Me

This page lists all the `/me` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/me` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## MeClient Endpoints

The MeClient instance gives access to the following `/me` endpoints. You can get a `MeClient` instance like so:

```typescript
const meClient = graphClient.me;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get a user | `GET /me` | `await meClient.list(params);` |
| Update user | `PATCH /me` | `await meClient.update(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = meClient.calendar;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar | `GET /me/calendar` | `await calendarClient.list(params);` |
| Update calendar | `PATCH /me/calendar` | `await calendarClient.update(params);` |

## CalendarPermissionsClient Endpoints

The CalendarPermissionsClient instance gives access to the following `/me/calendar/calendarPermissions` endpoints. You can get a `CalendarPermissionsClient` instance like so:

```typescript
const calendarPermissionsClient = calendarClient.calendarPermissions;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendarPermissions from me | `GET /me/calendar/calendarPermissions` | `await calendarPermissionsClient.list(params);` |
| Create calendarPermission | `POST /me/calendar/calendarPermissions` | `await calendarPermissionsClient.create(params);` |
| Get calendarPermissions from me | `GET /me/calendar/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.get({"calendarPermission-id": calendarPermissionId  });` |
| Delete navigation property calendarPermissions for me | `DELETE /me/calendar/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.delete({"calendarPermission-id": calendarPermissionId  });` |
| Update the navigation property calendarPermissions in me | `PATCH /me/calendar/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.update(params);` |

## CalendarViewClient Endpoints

The CalendarViewClient instance gives access to the following `/me/calendar/calendarView` endpoints. You can get a `CalendarViewClient` instance like so:

```typescript
const calendarViewClient = calendarClient.calendarView;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List calendarView | `GET /me/calendar/calendarView` | `await calendarViewClient.list(params);` |
| Get calendarView from me | `GET /me/calendar/calendarView/{event-id}` | `await calendarViewClient.get({"event-id": eventId  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendar/calendarView/{event-id}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await calendarViewClient.attachments(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendar/calendarView/{event-id}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendar/calendarView/{event-id}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendar/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendar/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendar/calendarView/{event-id}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendar/calendarView/{event-id}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendar/calendarView/{event-id}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await calendarViewClient.calendar(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendar/calendarView/{event-id}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendar/calendarView/{event-id}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await calendarViewClient.extensions(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendar/calendarView/{event-id}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendar/calendarView/{event-id}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendar/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendar/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendar/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## InstancesClient Endpoints

The InstancesClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances` endpoints. You can get a `InstancesClient` instance like so:

```typescript
const instancesClient = await calendarViewClient.instances(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get instances from me | `GET /me/calendar/calendarView/{event-id}/instances` | `await instancesClient.list(params);` |
| Get instances from me | `GET /me/calendar/calendarView/{event-id}/instances/{event-id1}` | `await instancesClient.get({"event-id1": eventId1  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await instancesClient.attachments(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendar/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendar/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendar/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await instancesClient.calendar(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendar/calendarView/{event-id}/instances/{event-id1}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await instancesClient.extensions(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendar/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendar/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendar/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendar/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await instancesClient.accept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await instancesClient.cancel(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await instancesClient.decline(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await instancesClient.dismissReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await instancesClient.forward(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await instancesClient.snoozeReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendar/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await instancesClient.tentativelyAccept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendar/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendar/calendarView/{event-id}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await calendarViewClient.accept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendar/calendarView/{event-id}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendar/calendarView/{event-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await calendarViewClient.cancel(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendar/calendarView/{event-id}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendar/calendarView/{event-id}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await calendarViewClient.decline(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendar/calendarView/{event-id}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendar/calendarView/{event-id}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await calendarViewClient.dismissReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendar/calendarView/{event-id}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendar/calendarView/{event-id}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await calendarViewClient.forward(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendar/calendarView/{event-id}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendar/calendarView/{event-id}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await calendarViewClient.snoozeReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendar/calendarView/{event-id}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendar/calendarView/{event-id}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await calendarViewClient.tentativelyAccept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendar/calendarView/{event-id}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## EventsClient Endpoints

The EventsClient instance gives access to the following `/me/calendar/events` endpoints. You can get a `EventsClient` instance like so:

```typescript
const eventsClient = calendarClient.events;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List events | `GET /me/calendar/events` | `await eventsClient.list(params);` |
| Create new navigation property to events for me | `POST /me/calendar/events` | `await eventsClient.create(params);` |
| Get events from me | `GET /me/calendar/events/{event-id}` | `await eventsClient.get({"event-id": eventId  });` |
| Delete navigation property events for me | `DELETE /me/calendar/events/{event-id}` | `await eventsClient.delete({"event-id": eventId  });` |
| Update the navigation property events in me | `PATCH /me/calendar/events/{event-id}` | `await eventsClient.update(params);` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendar/events/{event-id}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await eventsClient.attachments(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendar/events/{event-id}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendar/events/{event-id}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendar/events/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendar/events/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendar/events/{event-id}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendar/events/{event-id}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendar/events/{event-id}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await eventsClient.calendar(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendar/events/{event-id}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendar/events/{event-id}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await eventsClient.extensions(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendar/events/{event-id}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendar/events/{event-id}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendar/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendar/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendar/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## InstancesClient Endpoints

The InstancesClient instance gives access to the following `/me/calendar/events/{event-id}/instances` endpoints. You can get a `InstancesClient` instance like so:

```typescript
const instancesClient = await eventsClient.instances(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get instances from me | `GET /me/calendar/events/{event-id}/instances` | `await instancesClient.list(params);` |
| Get instances from me | `GET /me/calendar/events/{event-id}/instances/{event-id1}` | `await instancesClient.get({"event-id1": eventId1  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await instancesClient.attachments(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendar/events/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendar/events/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendar/events/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendar/events/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendar/events/{event-id}/instances/{event-id1}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await instancesClient.calendar(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendar/events/{event-id}/instances/{event-id1}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await instancesClient.extensions(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendar/events/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendar/events/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendar/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendar/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendar/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await instancesClient.accept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendar/events/{event-id}/instances/{event-id1}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await instancesClient.cancel(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendar/events/{event-id}/instances/{event-id1}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await instancesClient.decline(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendar/events/{event-id}/instances/{event-id1}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await instancesClient.dismissReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendar/events/{event-id}/instances/{event-id1}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await instancesClient.forward(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendar/events/{event-id}/instances/{event-id1}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await instancesClient.snoozeReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendar/events/{event-id}/instances/{event-id1}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendar/events/{event-id}/instances/{event-id1}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await instancesClient.tentativelyAccept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendar/events/{event-id}/instances/{event-id1}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendar/events/{event-id}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await eventsClient.accept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendar/events/{event-id}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendar/events/{event-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await eventsClient.cancel(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendar/events/{event-id}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendar/events/{event-id}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await eventsClient.decline(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendar/events/{event-id}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendar/events/{event-id}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await eventsClient.dismissReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendar/events/{event-id}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendar/events/{event-id}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await eventsClient.forward(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendar/events/{event-id}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendar/events/{event-id}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await eventsClient.snoozeReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendar/events/{event-id}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendar/events/{event-id}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await eventsClient.tentativelyAccept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendar/events/{event-id}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## GetScheduleClient Endpoints

The GetScheduleClient instance gives access to the following `/me/calendar/getSchedule` endpoints. You can get a `GetScheduleClient` instance like so:

```typescript
const getScheduleClient = calendarClient.getSchedule;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getSchedule | `POST /me/calendar/getSchedule` | `await getScheduleClient.create(params);` |

## CalendarGroupsClient Endpoints

The CalendarGroupsClient instance gives access to the following `/me/calendarGroups` endpoints. You can get a `CalendarGroupsClient` instance like so:

```typescript
const calendarGroupsClient = meClient.calendarGroups;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List calendarGroups | `GET /me/calendarGroups` | `await calendarGroupsClient.list(params);` |
| Create CalendarGroup | `POST /me/calendarGroups` | `await calendarGroupsClient.create(params);` |
| Get calendarGroup | `GET /me/calendarGroups/{calendarGroup-id}` | `await calendarGroupsClient.get({"calendarGroup-id": calendarGroupId  });` |
| Delete calendarGroup | `DELETE /me/calendarGroups/{calendarGroup-id}` | `await calendarGroupsClient.delete({"calendarGroup-id": calendarGroupId  });` |
| Update calendargroup | `PATCH /me/calendarGroups/{calendarGroup-id}` | `await calendarGroupsClient.update(params);` |

## CalendarsClient Endpoints

The CalendarsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars` endpoints. You can get a `CalendarsClient` instance like so:

```typescript
const calendarsClient = await calendarGroupsClient.calendars(calendarGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List calendars | `GET /me/calendarGroups/{calendarGroup-id}/calendars` | `await calendarsClient.list(params);` |
| Create Calendar | `POST /me/calendarGroups/{calendarGroup-id}/calendars` | `await calendarsClient.create(params);` |
| Get calendars from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}` | `await calendarsClient.get({"calendar-id": calendarId  });` |
| Delete navigation property calendars for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}` | `await calendarsClient.delete({"calendar-id": calendarId  });` |
| Update the navigation property calendars in me | `PATCH /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}` | `await calendarsClient.update(params);` |

## CalendarPermissionsClient Endpoints

The CalendarPermissionsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarPermissions` endpoints. You can get a `CalendarPermissionsClient` instance like so:

```typescript
const calendarPermissionsClient = await calendarsClient.calendarPermissions(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendarPermissions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarPermissions` | `await calendarPermissionsClient.list(params);` |
| Create new navigation property to calendarPermissions for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarPermissions` | `await calendarPermissionsClient.create(params);` |
| Get calendarPermissions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.get({"calendarPermission-id": calendarPermissionId  });` |
| Delete navigation property calendarPermissions for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.delete({"calendarPermission-id": calendarPermissionId  });` |
| Update the navigation property calendarPermissions in me | `PATCH /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.update(params);` |

## CalendarViewClient Endpoints

The CalendarViewClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView` endpoints. You can get a `CalendarViewClient` instance like so:

```typescript
const calendarViewClient = await calendarsClient.calendarView(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendarView from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView` | `await calendarViewClient.list(params);` |
| Get calendarView from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}` | `await calendarViewClient.get({"event-id": eventId  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await calendarViewClient.attachments(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await calendarViewClient.calendar(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await calendarViewClient.extensions(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## InstancesClient Endpoints

The InstancesClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances` endpoints. You can get a `InstancesClient` instance like so:

```typescript
const instancesClient = await calendarViewClient.instances(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get instances from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances` | `await instancesClient.list(params);` |
| Get instances from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}` | `await instancesClient.get({"event-id1": eventId1  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await instancesClient.attachments(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await instancesClient.calendar(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await instancesClient.extensions(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await instancesClient.accept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await instancesClient.cancel(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await instancesClient.decline(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await instancesClient.dismissReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await instancesClient.forward(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await instancesClient.snoozeReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await instancesClient.tentativelyAccept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await calendarViewClient.accept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await calendarViewClient.cancel(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await calendarViewClient.decline(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await calendarViewClient.dismissReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await calendarViewClient.forward(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await calendarViewClient.snoozeReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await calendarViewClient.tentativelyAccept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/calendarView/{event-id}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## EventsClient Endpoints

The EventsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events` endpoints. You can get a `EventsClient` instance like so:

```typescript
const eventsClient = await calendarsClient.events(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get events from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events` | `await eventsClient.list(params);` |
| Create new navigation property to events for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events` | `await eventsClient.create(params);` |
| Get events from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}` | `await eventsClient.get({"event-id": eventId  });` |
| Delete navigation property events for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}` | `await eventsClient.delete({"event-id": eventId  });` |
| Update the navigation property events in me | `PATCH /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}` | `await eventsClient.update(params);` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await eventsClient.attachments(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await eventsClient.calendar(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await eventsClient.extensions(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## InstancesClient Endpoints

The InstancesClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances` endpoints. You can get a `InstancesClient` instance like so:

```typescript
const instancesClient = await eventsClient.instances(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get instances from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances` | `await instancesClient.list(params);` |
| Get instances from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}` | `await instancesClient.get({"event-id1": eventId1  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await instancesClient.attachments(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await instancesClient.calendar(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await instancesClient.extensions(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await instancesClient.accept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await instancesClient.cancel(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await instancesClient.decline(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await instancesClient.dismissReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await instancesClient.forward(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await instancesClient.snoozeReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await instancesClient.tentativelyAccept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await eventsClient.accept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await eventsClient.cancel(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await eventsClient.decline(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await eventsClient.dismissReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await eventsClient.forward(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await eventsClient.snoozeReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await eventsClient.tentativelyAccept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/events/{event-id}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## GetScheduleClient Endpoints

The GetScheduleClient instance gives access to the following `/me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/getSchedule` endpoints. You can get a `GetScheduleClient` instance like so:

```typescript
const getScheduleClient = await calendarsClient.getSchedule(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getSchedule | `POST /me/calendarGroups/{calendarGroup-id}/calendars/{calendar-id}/getSchedule` | `await getScheduleClient.create(params);` |

## CalendarsClient Endpoints

The CalendarsClient instance gives access to the following `/me/calendars` endpoints. You can get a `CalendarsClient` instance like so:

```typescript
const calendarsClient = meClient.calendars;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List calendars | `GET /me/calendars` | `await calendarsClient.list(params);` |
| Create calendar | `POST /me/calendars` | `await calendarsClient.create(params);` |
| Get calendars from me | `GET /me/calendars/{calendar-id}` | `await calendarsClient.get({"calendar-id": calendarId  });` |
| Delete navigation property calendars for me | `DELETE /me/calendars/{calendar-id}` | `await calendarsClient.delete({"calendar-id": calendarId  });` |
| Update the navigation property calendars in me | `PATCH /me/calendars/{calendar-id}` | `await calendarsClient.update(params);` |

## CalendarPermissionsClient Endpoints

The CalendarPermissionsClient instance gives access to the following `/me/calendars/{calendar-id}/calendarPermissions` endpoints. You can get a `CalendarPermissionsClient` instance like so:

```typescript
const calendarPermissionsClient = await calendarsClient.calendarPermissions(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendarPermissions from me | `GET /me/calendars/{calendar-id}/calendarPermissions` | `await calendarPermissionsClient.list(params);` |
| Create new navigation property to calendarPermissions for me | `POST /me/calendars/{calendar-id}/calendarPermissions` | `await calendarPermissionsClient.create(params);` |
| Get calendarPermissions from me | `GET /me/calendars/{calendar-id}/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.get({"calendarPermission-id": calendarPermissionId  });` |
| Delete navigation property calendarPermissions for me | `DELETE /me/calendars/{calendar-id}/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.delete({"calendarPermission-id": calendarPermissionId  });` |
| Update the navigation property calendarPermissions in me | `PATCH /me/calendars/{calendar-id}/calendarPermissions/{calendarPermission-id}` | `await calendarPermissionsClient.update(params);` |

## CalendarViewClient Endpoints

The CalendarViewClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView` endpoints. You can get a `CalendarViewClient` instance like so:

```typescript
const calendarViewClient = await calendarsClient.calendarView(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendarView from me | `GET /me/calendars/{calendar-id}/calendarView` | `await calendarViewClient.list(params);` |
| Get calendarView from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}` | `await calendarViewClient.get({"event-id": eventId  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await calendarViewClient.attachments(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendars/{calendar-id}/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await calendarViewClient.calendar(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await calendarViewClient.extensions(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendars/{calendar-id}/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendars/{calendar-id}/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## InstancesClient Endpoints

The InstancesClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances` endpoints. You can get a `InstancesClient` instance like so:

```typescript
const instancesClient = await calendarViewClient.instances(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get instances from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/instances` | `await instancesClient.list(params);` |
| Get instances from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}` | `await instancesClient.get({"event-id1": eventId1  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await instancesClient.attachments(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await instancesClient.calendar(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await instancesClient.extensions(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await instancesClient.accept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await instancesClient.cancel(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await instancesClient.decline(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await instancesClient.dismissReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await instancesClient.forward(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await instancesClient.snoozeReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await instancesClient.tentativelyAccept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await calendarViewClient.accept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await calendarViewClient.cancel(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await calendarViewClient.decline(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await calendarViewClient.dismissReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await calendarViewClient.forward(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await calendarViewClient.snoozeReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendars/{calendar-id}/calendarView/{event-id}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await calendarViewClient.tentativelyAccept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendars/{calendar-id}/calendarView/{event-id}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## EventsClient Endpoints

The EventsClient instance gives access to the following `/me/calendars/{calendar-id}/events` endpoints. You can get a `EventsClient` instance like so:

```typescript
const eventsClient = await calendarsClient.events(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get events from me | `GET /me/calendars/{calendar-id}/events` | `await eventsClient.list(params);` |
| Create event | `POST /me/calendars/{calendar-id}/events` | `await eventsClient.create(params);` |
| Get events from me | `GET /me/calendars/{calendar-id}/events/{event-id}` | `await eventsClient.get({"event-id": eventId  });` |
| Delete navigation property events for me | `DELETE /me/calendars/{calendar-id}/events/{event-id}` | `await eventsClient.delete({"event-id": eventId  });` |
| Update the navigation property events in me | `PATCH /me/calendars/{calendar-id}/events/{event-id}` | `await eventsClient.update(params);` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await eventsClient.attachments(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendars/{calendar-id}/events/{event-id}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendars/{calendar-id}/events/{event-id}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendars/{calendar-id}/events/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendars/{calendar-id}/events/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendars/{calendar-id}/events/{event-id}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await eventsClient.calendar(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendars/{calendar-id}/events/{event-id}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await eventsClient.extensions(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendars/{calendar-id}/events/{event-id}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendars/{calendar-id}/events/{event-id}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendars/{calendar-id}/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendars/{calendar-id}/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendars/{calendar-id}/events/{event-id}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## InstancesClient Endpoints

The InstancesClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances` endpoints. You can get a `InstancesClient` instance like so:

```typescript
const instancesClient = await eventsClient.instances(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get instances from me | `GET /me/calendars/{calendar-id}/events/{event-id}/instances` | `await instancesClient.list(params);` |
| Get instances from me | `GET /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}` | `await instancesClient.get({"event-id1": eventId1  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await instancesClient.attachments(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await instancesClient.calendar(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await instancesClient.extensions(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await instancesClient.accept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await instancesClient.cancel(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await instancesClient.decline(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await instancesClient.dismissReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await instancesClient.forward(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await instancesClient.snoozeReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await instancesClient.tentativelyAccept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendars/{calendar-id}/events/{event-id}/instances/{event-id1}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await eventsClient.accept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendars/{calendar-id}/events/{event-id}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await eventsClient.cancel(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendars/{calendar-id}/events/{event-id}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await eventsClient.decline(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendars/{calendar-id}/events/{event-id}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await eventsClient.dismissReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendars/{calendar-id}/events/{event-id}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await eventsClient.forward(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendars/{calendar-id}/events/{event-id}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await eventsClient.snoozeReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendars/{calendar-id}/events/{event-id}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendars/{calendar-id}/events/{event-id}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await eventsClient.tentativelyAccept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendars/{calendar-id}/events/{event-id}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## GetScheduleClient Endpoints

The GetScheduleClient instance gives access to the following `/me/calendars/{calendar-id}/getSchedule` endpoints. You can get a `GetScheduleClient` instance like so:

```typescript
const getScheduleClient = await calendarsClient.getSchedule(calendarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getSchedule | `POST /me/calendars/{calendar-id}/getSchedule` | `await getScheduleClient.create(params);` |

## CalendarViewClient Endpoints

The CalendarViewClient instance gives access to the following `/me/calendarView` endpoints. You can get a `CalendarViewClient` instance like so:

```typescript
const calendarViewClient = meClient.calendarView;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List calendarView | `GET /me/calendarView` | `await calendarViewClient.list(params);` |
| Get calendarView from me | `GET /me/calendarView/{event-id}` | `await calendarViewClient.get({"event-id": eventId  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendarView/{event-id}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await calendarViewClient.attachments(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendarView/{event-id}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendarView/{event-id}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendarView/{event-id}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendarView/{event-id}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendarView/{event-id}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendarView/{event-id}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await calendarViewClient.calendar(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendarView/{event-id}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendarView/{event-id}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await calendarViewClient.extensions(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendarView/{event-id}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendarView/{event-id}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendarView/{event-id}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## InstancesClient Endpoints

The InstancesClient instance gives access to the following `/me/calendarView/{event-id}/instances` endpoints. You can get a `InstancesClient` instance like so:

```typescript
const instancesClient = await calendarViewClient.instances(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get instances from me | `GET /me/calendarView/{event-id}/instances` | `await instancesClient.list(params);` |
| Get instances from me | `GET /me/calendarView/{event-id}/instances/{event-id1}` | `await instancesClient.get({"event-id1": eventId1  });` |

## AttachmentsClient Endpoints

The AttachmentsClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/attachments` endpoints. You can get a `AttachmentsClient` instance like so:

```typescript
const attachmentsClient = await instancesClient.attachments(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attachments from me | `GET /me/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.list(params);` |
| Create new navigation property to attachments for me | `POST /me/calendarView/{event-id}/instances/{event-id1}/attachments` | `await attachmentsClient.create(params);` |
| Get attachments from me | `GET /me/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.get({"attachment-id": attachmentId  });` |
| Delete navigation property attachments for me | `DELETE /me/calendarView/{event-id}/instances/{event-id1}/attachments/{attachment-id}` | `await attachmentsClient.delete({"attachment-id": attachmentId  });` |

## CreateUploadSessionClient Endpoints

The CreateUploadSessionClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` endpoints. You can get a `CreateUploadSessionClient` instance like so:

```typescript
const createUploadSessionClient = attachmentsClient.createUploadSession;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createUploadSession | `POST /me/calendarView/{event-id}/instances/{event-id1}/attachments/createUploadSession` | `await createUploadSessionClient.create(params);` |

## CalendarClient Endpoints

The CalendarClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/calendar` endpoints. You can get a `CalendarClient` instance like so:

```typescript
const calendarClient = await instancesClient.calendar(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get calendar from me | `GET /me/calendarView/{event-id}/instances/{event-id1}/calendar` | `await calendarClient.list(params);` |

## ExtensionsClient Endpoints

The ExtensionsClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/extensions` endpoints. You can get a `ExtensionsClient` instance like so:

```typescript
const extensionsClient = await instancesClient.extensions(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get extensions from me | `GET /me/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.list(params);` |
| Create new navigation property to extensions for me | `POST /me/calendarView/{event-id}/instances/{event-id1}/extensions` | `await extensionsClient.create(params);` |
| Get extensions from me | `GET /me/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.get({"extension-id": extensionId  });` |
| Delete navigation property extensions for me | `DELETE /me/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.delete({"extension-id": extensionId  });` |
| Update the navigation property extensions in me | `PATCH /me/calendarView/{event-id}/instances/{event-id1}/extensions/{extension-id}` | `await extensionsClient.update(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await instancesClient.accept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendarView/{event-id}/instances/{event-id1}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await instancesClient.cancel(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendarView/{event-id}/instances/{event-id1}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await instancesClient.decline(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendarView/{event-id}/instances/{event-id1}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await instancesClient.dismissReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendarView/{event-id}/instances/{event-id1}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await instancesClient.forward(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendarView/{event-id}/instances/{event-id1}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await instancesClient.snoozeReminder(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendarView/{event-id}/instances/{event-id1}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await instancesClient.tentativelyAccept(eventId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendarView/{event-id}/instances/{event-id1}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## AcceptClient Endpoints

The AcceptClient instance gives access to the following `/me/calendarView/{event-id}/accept` endpoints. You can get a `AcceptClient` instance like so:

```typescript
const acceptClient = await calendarViewClient.accept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action accept | `POST /me/calendarView/{event-id}/accept` | `await acceptClient.create(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/me/calendarView/{event-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await calendarViewClient.cancel(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /me/calendarView/{event-id}/cancel` | `await cancelClient.create(params);` |

## DeclineClient Endpoints

The DeclineClient instance gives access to the following `/me/calendarView/{event-id}/decline` endpoints. You can get a `DeclineClient` instance like so:

```typescript
const declineClient = await calendarViewClient.decline(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action decline | `POST /me/calendarView/{event-id}/decline` | `await declineClient.create(params);` |

## DismissReminderClient Endpoints

The DismissReminderClient instance gives access to the following `/me/calendarView/{event-id}/dismissReminder` endpoints. You can get a `DismissReminderClient` instance like so:

```typescript
const dismissReminderClient = await calendarViewClient.dismissReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action dismissReminder | `POST /me/calendarView/{event-id}/dismissReminder` | `await dismissReminderClient.create(params);` |

## ForwardClient Endpoints

The ForwardClient instance gives access to the following `/me/calendarView/{event-id}/forward` endpoints. You can get a `ForwardClient` instance like so:

```typescript
const forwardClient = await calendarViewClient.forward(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action forward | `POST /me/calendarView/{event-id}/forward` | `await forwardClient.create(params);` |

## SnoozeReminderClient Endpoints

The SnoozeReminderClient instance gives access to the following `/me/calendarView/{event-id}/snoozeReminder` endpoints. You can get a `SnoozeReminderClient` instance like so:

```typescript
const snoozeReminderClient = await calendarViewClient.snoozeReminder(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action snoozeReminder | `POST /me/calendarView/{event-id}/snoozeReminder` | `await snoozeReminderClient.create(params);` |

## TentativelyAcceptClient Endpoints

The TentativelyAcceptClient instance gives access to the following `/me/calendarView/{event-id}/tentativelyAccept` endpoints. You can get a `TentativelyAcceptClient` instance like so:

```typescript
const tentativelyAcceptClient = await calendarViewClient.tentativelyAccept(eventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action tentativelyAccept | `POST /me/calendarView/{event-id}/tentativelyAccept` | `await tentativelyAcceptClient.create(params);` |

## ChatsClient Endpoints

The ChatsClient instance gives access to the following `/me/chats` endpoints. You can get a `ChatsClient` instance like so:

```typescript
const chatsClient = meClient.chats;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get chats from me | `GET /me/chats` | `await chatsClient.list(params);` |
| Create new navigation property to chats for me | `POST /me/chats` | `await chatsClient.create(params);` |
| Get chats from me | `GET /me/chats/{chat-id}` | `await chatsClient.get({"chat-id": chatId  });` |
| Delete navigation property chats for me | `DELETE /me/chats/{chat-id}` | `await chatsClient.delete({"chat-id": chatId  });` |
| Update the navigation property chats in me | `PATCH /me/chats/{chat-id}` | `await chatsClient.update(params);` |

## InstalledAppsClient Endpoints

The InstalledAppsClient instance gives access to the following `/me/chats/{chat-id}/installedApps` endpoints. You can get a `InstalledAppsClient` instance like so:

```typescript
const installedAppsClient = await chatsClient.installedApps(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get installedApps from me | `GET /me/chats/{chat-id}/installedApps` | `await installedAppsClient.list(params);` |
| Create new navigation property to installedApps for me | `POST /me/chats/{chat-id}/installedApps` | `await installedAppsClient.create(params);` |
| Get installedApps from me | `GET /me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.get({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Delete navigation property installedApps for me | `DELETE /me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.delete({"teamsAppInstallation-id": teamsAppInstallationId  });` |
| Update the navigation property installedApps in me | `PATCH /me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}` | `await installedAppsClient.update(params);` |

## UpgradeClient Endpoints

The UpgradeClient instance gives access to the following `/me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/upgrade` endpoints. You can get a `UpgradeClient` instance like so:

```typescript
const upgradeClient = await installedAppsClient.upgrade(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action upgrade | `POST /me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/upgrade` | `await upgradeClient.create(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await installedAppsClient.teamsApp(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from me | `GET /me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsApp` | `await teamsAppClient.list(params);` |

## TeamsAppDefinitionClient Endpoints

The TeamsAppDefinitionClient instance gives access to the following `/me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` endpoints. You can get a `TeamsAppDefinitionClient` instance like so:

```typescript
const teamsAppDefinitionClient = await installedAppsClient.teamsAppDefinition(teamsAppInstallationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsAppDefinition from me | `GET /me/chats/{chat-id}/installedApps/{teamsAppInstallation-id}/teamsAppDefinition` | `await teamsAppDefinitionClient.list(params);` |

## LastMessagePreviewClient Endpoints

The LastMessagePreviewClient instance gives access to the following `/me/chats/{chat-id}/lastMessagePreview` endpoints. You can get a `LastMessagePreviewClient` instance like so:

```typescript
const lastMessagePreviewClient = await chatsClient.lastMessagePreview(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastMessagePreview from me | `GET /me/chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.list(params);` |
| Delete navigation property lastMessagePreview for me | `DELETE /me/chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.delete({"chat-id": chatId  });` |
| Update the navigation property lastMessagePreview in me | `PATCH /me/chats/{chat-id}/lastMessagePreview` | `await lastMessagePreviewClient.update(params);` |

## MembersClient Endpoints

The MembersClient instance gives access to the following `/me/chats/{chat-id}/members` endpoints. You can get a `MembersClient` instance like so:

```typescript
const membersClient = await chatsClient.members(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List members of a chat | `GET /me/chats/{chat-id}/members` | `await membersClient.list(params);` |
| Create new navigation property to members for me | `POST /me/chats/{chat-id}/members` | `await membersClient.create(params);` |
| Get members from me | `GET /me/chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.get({"conversationMember-id": conversationMemberId  });` |
| Delete navigation property members for me | `DELETE /me/chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.delete({"conversationMember-id": conversationMemberId  });` |
| Update the navigation property members in me | `PATCH /me/chats/{chat-id}/members/{conversationMember-id}` | `await membersClient.update(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/me/chats/{chat-id}/members/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = membersClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /me/chats/{chat-id}/members/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/me/chats/{chat-id}/members/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = membersClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /me/chats/{chat-id}/members/remove` | `await removeClient.create(params);` |

## MessagesClient Endpoints

The MessagesClient instance gives access to the following `/me/chats/{chat-id}/messages` endpoints. You can get a `MessagesClient` instance like so:

```typescript
const messagesClient = await chatsClient.messages(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get messages from me | `GET /me/chats/{chat-id}/messages` | `await messagesClient.list(params);` |
| Create new navigation property to messages for me | `POST /me/chats/{chat-id}/messages` | `await messagesClient.create(params);` |
| Get messages from me | `GET /me/chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.get({"chatMessage-id": chatMessageId  });` |
| Delete navigation property messages for me | `DELETE /me/chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.delete({"chatMessage-id": chatMessageId  });` |
| Update the navigation property messages in me | `PATCH /me/chats/{chat-id}/messages/{chatMessage-id}` | `await messagesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await messagesClient.hostedContents(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from me | `GET /me/chats/{chat-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for me | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from me | `GET /me/chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for me | `DELETE /me/chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in me | `PATCH /me/chats/{chat-id}/messages/{chatMessage-id}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await messagesClient.setReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await messagesClient.softDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await messagesClient.undoSoftDelete(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await messagesClient.unsetReaction(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/unsetReaction` | `await unsetReactionClient.create(params);` |

## RepliesClient Endpoints

The RepliesClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/replies` endpoints. You can get a `RepliesClient` instance like so:

```typescript
const repliesClient = await messagesClient.replies(chatMessageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get replies from me | `GET /me/chats/{chat-id}/messages/{chatMessage-id}/replies` | `await repliesClient.list(params);` |
| Create new navigation property to replies for me | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/replies` | `await repliesClient.create(params);` |
| Get replies from me | `GET /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.get({"chatMessage-id1": chatMessageId1  });` |
| Delete navigation property replies for me | `DELETE /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.delete({"chatMessage-id1": chatMessageId1  });` |
| Update the navigation property replies in me | `PATCH /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}` | `await repliesClient.update(params);` |

## HostedContentsClient Endpoints

The HostedContentsClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` endpoints. You can get a `HostedContentsClient` instance like so:

```typescript
const hostedContentsClient = await repliesClient.hostedContents(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get hostedContents from me | `GET /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.list(params);` |
| Create new navigation property to hostedContents for me | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents` | `await hostedContentsClient.create(params);` |
| Get hostedContents from me | `GET /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.get({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Delete navigation property hostedContents for me | `DELETE /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.delete({"chatMessageHostedContent-id": chatMessageHostedContentId  });` |
| Update the navigation property hostedContents in me | `PATCH /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/hostedContents/{chatMessageHostedContent-id}` | `await hostedContentsClient.update(params);` |

## SetReactionClient Endpoints

The SetReactionClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` endpoints. You can get a `SetReactionClient` instance like so:

```typescript
const setReactionClient = await repliesClient.setReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setReaction | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/setReaction` | `await setReactionClient.create(params);` |

## SoftDeleteClient Endpoints

The SoftDeleteClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` endpoints. You can get a `SoftDeleteClient` instance like so:

```typescript
const softDeleteClient = await repliesClient.softDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action softDelete | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/softDelete` | `await softDeleteClient.create(params);` |

## UndoSoftDeleteClient Endpoints

The UndoSoftDeleteClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` endpoints. You can get a `UndoSoftDeleteClient` instance like so:

```typescript
const undoSoftDeleteClient = await repliesClient.undoSoftDelete(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action undoSoftDelete | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/undoSoftDelete` | `await undoSoftDeleteClient.create(params);` |

## UnsetReactionClient Endpoints

The UnsetReactionClient instance gives access to the following `/me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` endpoints. You can get a `UnsetReactionClient` instance like so:

```typescript
const unsetReactionClient = await repliesClient.unsetReaction(chatMessageId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetReaction | `POST /me/chats/{chat-id}/messages/{chatMessage-id}/replies/{chatMessage-id1}/unsetReaction` | `await unsetReactionClient.create(params);` |

## HideForUserClient Endpoints

The HideForUserClient instance gives access to the following `/me/chats/{chat-id}/hideForUser` endpoints. You can get a `HideForUserClient` instance like so:

```typescript
const hideForUserClient = await chatsClient.hideForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action hideForUser | `POST /me/chats/{chat-id}/hideForUser` | `await hideForUserClient.create(params);` |

## MarkChatReadForUserClient Endpoints

The MarkChatReadForUserClient instance gives access to the following `/me/chats/{chat-id}/markChatReadForUser` endpoints. You can get a `MarkChatReadForUserClient` instance like so:

```typescript
const markChatReadForUserClient = await chatsClient.markChatReadForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action markChatReadForUser | `POST /me/chats/{chat-id}/markChatReadForUser` | `await markChatReadForUserClient.create(params);` |

## MarkChatUnreadForUserClient Endpoints

The MarkChatUnreadForUserClient instance gives access to the following `/me/chats/{chat-id}/markChatUnreadForUser` endpoints. You can get a `MarkChatUnreadForUserClient` instance like so:

```typescript
const markChatUnreadForUserClient = await chatsClient.markChatUnreadForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action markChatUnreadForUser | `POST /me/chats/{chat-id}/markChatUnreadForUser` | `await markChatUnreadForUserClient.create(params);` |

## SendActivityNotificationClient Endpoints

The SendActivityNotificationClient instance gives access to the following `/me/chats/{chat-id}/sendActivityNotification` endpoints. You can get a `SendActivityNotificationClient` instance like so:

```typescript
const sendActivityNotificationClient = await chatsClient.sendActivityNotification(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendActivityNotification | `POST /me/chats/{chat-id}/sendActivityNotification` | `await sendActivityNotificationClient.create(params);` |

## UnhideForUserClient Endpoints

The UnhideForUserClient instance gives access to the following `/me/chats/{chat-id}/unhideForUser` endpoints. You can get a `UnhideForUserClient` instance like so:

```typescript
const unhideForUserClient = await chatsClient.unhideForUser(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unhideForUser | `POST /me/chats/{chat-id}/unhideForUser` | `await unhideForUserClient.create(params);` |

## PermissionGrantsClient Endpoints

The PermissionGrantsClient instance gives access to the following `/me/chats/{chat-id}/permissionGrants` endpoints. You can get a `PermissionGrantsClient` instance like so:

```typescript
const permissionGrantsClient = await chatsClient.permissionGrants(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get permissionGrants from me | `GET /me/chats/{chat-id}/permissionGrants` | `await permissionGrantsClient.list(params);` |
| Create new navigation property to permissionGrants for me | `POST /me/chats/{chat-id}/permissionGrants` | `await permissionGrantsClient.create(params);` |
| Get permissionGrants from me | `GET /me/chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.get({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Delete navigation property permissionGrants for me | `DELETE /me/chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.delete({"resourceSpecificPermissionGrant-id": resourceSpecificPermissionGrantId  });` |
| Update the navigation property permissionGrants in me | `PATCH /me/chats/{chat-id}/permissionGrants/{resourceSpecificPermissionGrant-id}` | `await permissionGrantsClient.update(params);` |

## PinnedMessagesClient Endpoints

The PinnedMessagesClient instance gives access to the following `/me/chats/{chat-id}/pinnedMessages` endpoints. You can get a `PinnedMessagesClient` instance like so:

```typescript
const pinnedMessagesClient = await chatsClient.pinnedMessages(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get pinnedMessages from me | `GET /me/chats/{chat-id}/pinnedMessages` | `await pinnedMessagesClient.list(params);` |
| Create new navigation property to pinnedMessages for me | `POST /me/chats/{chat-id}/pinnedMessages` | `await pinnedMessagesClient.create(params);` |
| Get pinnedMessages from me | `GET /me/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.get({"pinnedChatMessageInfo-id": pinnedChatMessageInfoId  });` |
| Delete navigation property pinnedMessages for me | `DELETE /me/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.delete({"pinnedChatMessageInfo-id": pinnedChatMessageInfoId  });` |
| Update the navigation property pinnedMessages in me | `PATCH /me/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}` | `await pinnedMessagesClient.update(params);` |

## MessageClient Endpoints

The MessageClient instance gives access to the following `/me/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}/message` endpoints. You can get a `MessageClient` instance like so:

```typescript
const messageClient = await pinnedMessagesClient.message(pinnedChatMessageInfoId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get message from me | `GET /me/chats/{chat-id}/pinnedMessages/{pinnedChatMessageInfo-id}/message` | `await messageClient.list(params);` |

## TabsClient Endpoints

The TabsClient instance gives access to the following `/me/chats/{chat-id}/tabs` endpoints. You can get a `TabsClient` instance like so:

```typescript
const tabsClient = await chatsClient.tabs(chatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get tabs from me | `GET /me/chats/{chat-id}/tabs` | `await tabsClient.list(params);` |
| Create new navigation property to tabs for me | `POST /me/chats/{chat-id}/tabs` | `await tabsClient.create(params);` |
| Get tabs from me | `GET /me/chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.get({"teamsTab-id": teamsTabId  });` |
| Delete navigation property tabs for me | `DELETE /me/chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.delete({"teamsTab-id": teamsTabId  });` |
| Update the navigation property tabs in me | `PATCH /me/chats/{chat-id}/tabs/{teamsTab-id}` | `await tabsClient.update(params);` |

## TeamsAppClient Endpoints

The TeamsAppClient instance gives access to the following `/me/chats/{chat-id}/tabs/{teamsTab-id}/teamsApp` endpoints. You can get a `TeamsAppClient` instance like so:

```typescript
const teamsAppClient = await tabsClient.teamsApp(teamsTabId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamsApp from me | `GET /me/chats/{chat-id}/tabs/{teamsTab-id}/teamsApp` | `await teamsAppClient.list(params);` |

## PhotoClient Endpoints

The PhotoClient instance gives access to the following `/me/photo` endpoints. You can get a `PhotoClient` instance like so:

```typescript
const photoClient = meClient.photo;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get profilePhoto | `GET /me/photo` | `await photoClient.list(params);` |
| Delete profilePhoto | `DELETE /me/photo` | `await photoClient.delete({"":   });` |
| Update profilePhoto | `PATCH /me/photo` | `await photoClient.update(params);` |

## PhotosClient Endpoints

The PhotosClient instance gives access to the following `/me/photos` endpoints. You can get a `PhotosClient` instance like so:

```typescript
const photosClient = meClient.photos;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get photos from me | `GET /me/photos` | `await photosClient.list(params);` |
| Get photos from me | `GET /me/photos/{profilePhoto-id}` | `await photosClient.get({"profilePhoto-id": profilePhotoId  });` |

## PresenceClient Endpoints

The PresenceClient instance gives access to the following `/me/presence` endpoints. You can get a `PresenceClient` instance like so:

```typescript
const presenceClient = meClient.presence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get presence | `GET /me/presence` | `await presenceClient.list(params);` |
| Delete navigation property presence for me | `DELETE /me/presence` | `await presenceClient.delete({"":   });` |
| Update the navigation property presence in me | `PATCH /me/presence` | `await presenceClient.update(params);` |

## ClearPresenceClient Endpoints

The ClearPresenceClient instance gives access to the following `/me/presence/clearPresence` endpoints. You can get a `ClearPresenceClient` instance like so:

```typescript
const clearPresenceClient = presenceClient.clearPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action clearPresence | `POST /me/presence/clearPresence` | `await clearPresenceClient.create(params);` |

## ClearUserPreferredPresenceClient Endpoints

The ClearUserPreferredPresenceClient instance gives access to the following `/me/presence/clearUserPreferredPresence` endpoints. You can get a `ClearUserPreferredPresenceClient` instance like so:

```typescript
const clearUserPreferredPresenceClient = presenceClient.clearUserPreferredPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action clearUserPreferredPresence | `POST /me/presence/clearUserPreferredPresence` | `await clearUserPreferredPresenceClient.create(params);` |

## SetPresenceClient Endpoints

The SetPresenceClient instance gives access to the following `/me/presence/setPresence` endpoints. You can get a `SetPresenceClient` instance like so:

```typescript
const setPresenceClient = presenceClient.setPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setPresence | `POST /me/presence/setPresence` | `await setPresenceClient.create(params);` |

## SetStatusMessageClient Endpoints

The SetStatusMessageClient instance gives access to the following `/me/presence/setStatusMessage` endpoints. You can get a `SetStatusMessageClient` instance like so:

```typescript
const setStatusMessageClient = presenceClient.setStatusMessage;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setStatusMessage | `POST /me/presence/setStatusMessage` | `await setStatusMessageClient.create(params);` |

## SetUserPreferredPresenceClient Endpoints

The SetUserPreferredPresenceClient instance gives access to the following `/me/presence/setUserPreferredPresence` endpoints. You can get a `SetUserPreferredPresenceClient` instance like so:

```typescript
const setUserPreferredPresenceClient = presenceClient.setUserPreferredPresence;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setUserPreferredPresence | `POST /me/presence/setUserPreferredPresence` | `await setUserPreferredPresenceClient.create(params);` |
