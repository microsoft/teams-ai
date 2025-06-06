# Communications

This page lists all the `/communications` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/communications` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/application-post-calls?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## CommunicationsClient Endpoints

The CommunicationsClient instance gives access to the following `/communications` endpoints. You can get a `CommunicationsClient` instance like so:

```typescript
const communicationsClient = graphClient.communications;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get communications | `GET /communications` | `await communicationsClient.list(params);` |
| Update communications | `PATCH /communications` | `await communicationsClient.update(params);` |

## CallRecordsClient Endpoints

The CallRecordsClient instance gives access to the following `/communications/callRecords` endpoints. You can get a `CallRecordsClient` instance like so:

```typescript
const callRecordsClient = communicationsClient.callRecords;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List callRecords | `GET /communications/callRecords` | `await callRecordsClient.list(params);` |
| Create new navigation property to callRecords for communications | `POST /communications/callRecords` | `await callRecordsClient.create(params);` |
| Get callRecord | `GET /communications/callRecords/{callRecord-id}` | `await callRecordsClient.get({"callRecord-id": callRecordId  });` |
| Delete navigation property callRecords for communications | `DELETE /communications/callRecords/{callRecord-id}` | `await callRecordsClient.delete({"callRecord-id": callRecordId  });` |
| Update the navigation property callRecords in communications | `PATCH /communications/callRecords/{callRecord-id}` | `await callRecordsClient.update(params);` |

## OrganizerV2Client Endpoints

The OrganizerV2Client instance gives access to the following `/communications/callRecords/{callRecord-id}/organizer_v2` endpoints. You can get a `OrganizerV2Client` instance like so:

```typescript
const organizer_v2Client = await callRecordsClient.organizer_v2(callRecordId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get organizer_v2 from communications | `GET /communications/callRecords/{callRecord-id}/organizer_v2` | `await organizer_v2Client.list(params);` |
| Delete navigation property organizer_v2 for communications | `DELETE /communications/callRecords/{callRecord-id}/organizer_v2` | `await organizer_v2Client.delete({"callRecord-id": callRecordId  });` |
| Update the navigation property organizer_v2 in communications | `PATCH /communications/callRecords/{callRecord-id}/organizer_v2` | `await organizer_v2Client.update(params);` |

## ParticipantsV2Client Endpoints

The ParticipantsV2Client instance gives access to the following `/communications/callRecords/{callRecord-id}/participants_v2` endpoints. You can get a `ParticipantsV2Client` instance like so:

```typescript
const participants_v2Client = await callRecordsClient.participants_v2(callRecordId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List participants_v2 | `GET /communications/callRecords/{callRecord-id}/participants_v2` | `await participants_v2Client.list(params);` |
| Create new navigation property to participants_v2 for communications | `POST /communications/callRecords/{callRecord-id}/participants_v2` | `await participants_v2Client.create(params);` |
| Get participants_v2 from communications | `GET /communications/callRecords/{callRecord-id}/participants_v2/{participant-id}` | `await participants_v2Client.get({"participant-id": participantId  });` |
| Delete navigation property participants_v2 for communications | `DELETE /communications/callRecords/{callRecord-id}/participants_v2/{participant-id}` | `await participants_v2Client.delete({"participant-id": participantId  });` |
| Update the navigation property participants_v2 in communications | `PATCH /communications/callRecords/{callRecord-id}/participants_v2/{participant-id}` | `await participants_v2Client.update(params);` |

## SessionsClient Endpoints

The SessionsClient instance gives access to the following `/communications/callRecords/{callRecord-id}/sessions` endpoints. You can get a `SessionsClient` instance like so:

```typescript
const sessionsClient = await callRecordsClient.sessions(callRecordId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List sessions | `GET /communications/callRecords/{callRecord-id}/sessions` | `await sessionsClient.list(params);` |
| Create new navigation property to sessions for communications | `POST /communications/callRecords/{callRecord-id}/sessions` | `await sessionsClient.create(params);` |
| Get sessions from communications | `GET /communications/callRecords/{callRecord-id}/sessions/{session-id}` | `await sessionsClient.get({"session-id": sessionId  });` |
| Delete navigation property sessions for communications | `DELETE /communications/callRecords/{callRecord-id}/sessions/{session-id}` | `await sessionsClient.delete({"session-id": sessionId  });` |
| Update the navigation property sessions in communications | `PATCH /communications/callRecords/{callRecord-id}/sessions/{session-id}` | `await sessionsClient.update(params);` |

## SegmentsClient Endpoints

The SegmentsClient instance gives access to the following `/communications/callRecords/{callRecord-id}/sessions/{session-id}/segments` endpoints. You can get a `SegmentsClient` instance like so:

```typescript
const segmentsClient = await sessionsClient.segments(sessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get segments from communications | `GET /communications/callRecords/{callRecord-id}/sessions/{session-id}/segments` | `await segmentsClient.list(params);` |
| Create new navigation property to segments for communications | `POST /communications/callRecords/{callRecord-id}/sessions/{session-id}/segments` | `await segmentsClient.create(params);` |
| Get segments from communications | `GET /communications/callRecords/{callRecord-id}/sessions/{session-id}/segments/{segment-id}` | `await segmentsClient.get({"segment-id": segmentId  });` |
| Delete navigation property segments for communications | `DELETE /communications/callRecords/{callRecord-id}/sessions/{session-id}/segments/{segment-id}` | `await segmentsClient.delete({"segment-id": segmentId  });` |
| Update the navigation property segments in communications | `PATCH /communications/callRecords/{callRecord-id}/sessions/{session-id}/segments/{segment-id}` | `await segmentsClient.update(params);` |

## CallsClient Endpoints

The CallsClient instance gives access to the following `/communications/calls` endpoints. You can get a `CallsClient` instance like so:

```typescript
const callsClient = communicationsClient.calls;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get call | `GET /communications/calls` | `await callsClient.list(params);` |
| Create call | `POST /communications/calls` | `await callsClient.create(params);` |
| Get call | `GET /communications/calls/{call-id}` | `await callsClient.get({"call-id": callId  });` |
| Delete call | `DELETE /communications/calls/{call-id}` | `await callsClient.delete({"call-id": callId  });` |
| Update the navigation property calls in communications | `PATCH /communications/calls/{call-id}` | `await callsClient.update(params);` |

## AudioRoutingGroupsClient Endpoints

The AudioRoutingGroupsClient instance gives access to the following `/communications/calls/{call-id}/audioRoutingGroups` endpoints. You can get a `AudioRoutingGroupsClient` instance like so:

```typescript
const audioRoutingGroupsClient = await callsClient.audioRoutingGroups(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List audioRoutingGroups | `GET /communications/calls/{call-id}/audioRoutingGroups` | `await audioRoutingGroupsClient.list(params);` |
| Create audioRoutingGroup | `POST /communications/calls/{call-id}/audioRoutingGroups` | `await audioRoutingGroupsClient.create(params);` |
| Get audioRoutingGroup | `GET /communications/calls/{call-id}/audioRoutingGroups/{audioRoutingGroup-id}` | `await audioRoutingGroupsClient.get({"audioRoutingGroup-id": audioRoutingGroupId  });` |
| Delete audioRoutingGroup | `DELETE /communications/calls/{call-id}/audioRoutingGroups/{audioRoutingGroup-id}` | `await audioRoutingGroupsClient.delete({"audioRoutingGroup-id": audioRoutingGroupId  });` |
| Update audioRoutingGroup | `PATCH /communications/calls/{call-id}/audioRoutingGroups/{audioRoutingGroup-id}` | `await audioRoutingGroupsClient.update(params);` |

## ContentSharingSessionsClient Endpoints

The ContentSharingSessionsClient instance gives access to the following `/communications/calls/{call-id}/contentSharingSessions` endpoints. You can get a `ContentSharingSessionsClient` instance like so:

```typescript
const contentSharingSessionsClient = await callsClient.contentSharingSessions(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List contentSharingSessions | `GET /communications/calls/{call-id}/contentSharingSessions` | `await contentSharingSessionsClient.list(params);` |
| Create new navigation property to contentSharingSessions for communications | `POST /communications/calls/{call-id}/contentSharingSessions` | `await contentSharingSessionsClient.create(params);` |
| Get contentSharingSession | `GET /communications/calls/{call-id}/contentSharingSessions/{contentSharingSession-id}` | `await contentSharingSessionsClient.get({"contentSharingSession-id": contentSharingSessionId  });` |
| Delete navigation property contentSharingSessions for communications | `DELETE /communications/calls/{call-id}/contentSharingSessions/{contentSharingSession-id}` | `await contentSharingSessionsClient.delete({"contentSharingSession-id": contentSharingSessionId  });` |
| Update the navigation property contentSharingSessions in communications | `PATCH /communications/calls/{call-id}/contentSharingSessions/{contentSharingSession-id}` | `await contentSharingSessionsClient.update(params);` |

## AddLargeGalleryViewClient Endpoints

The AddLargeGalleryViewClient instance gives access to the following `/communications/calls/{call-id}/addLargeGalleryView` endpoints. You can get a `AddLargeGalleryViewClient` instance like so:

```typescript
const addLargeGalleryViewClient = await callsClient.addLargeGalleryView(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action addLargeGalleryView | `POST /communications/calls/{call-id}/addLargeGalleryView` | `await addLargeGalleryViewClient.create(params);` |

## AnswerClient Endpoints

The AnswerClient instance gives access to the following `/communications/calls/{call-id}/answer` endpoints. You can get a `AnswerClient` instance like so:

```typescript
const answerClient = await callsClient.answer(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action answer | `POST /communications/calls/{call-id}/answer` | `await answerClient.create(params);` |

## CancelMediaProcessingClient Endpoints

The CancelMediaProcessingClient instance gives access to the following `/communications/calls/{call-id}/cancelMediaProcessing` endpoints. You can get a `CancelMediaProcessingClient` instance like so:

```typescript
const cancelMediaProcessingClient = await callsClient.cancelMediaProcessing(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancelMediaProcessing | `POST /communications/calls/{call-id}/cancelMediaProcessing` | `await cancelMediaProcessingClient.create(params);` |

## ChangeScreenSharingRoleClient Endpoints

The ChangeScreenSharingRoleClient instance gives access to the following `/communications/calls/{call-id}/changeScreenSharingRole` endpoints. You can get a `ChangeScreenSharingRoleClient` instance like so:

```typescript
const changeScreenSharingRoleClient = await callsClient.changeScreenSharingRole(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action changeScreenSharingRole | `POST /communications/calls/{call-id}/changeScreenSharingRole` | `await changeScreenSharingRoleClient.create(params);` |

## KeepAliveClient Endpoints

The KeepAliveClient instance gives access to the following `/communications/calls/{call-id}/keepAlive` endpoints. You can get a `KeepAliveClient` instance like so:

```typescript
const keepAliveClient = await callsClient.keepAlive(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action keepAlive | `POST /communications/calls/{call-id}/keepAlive` | `await keepAliveClient.create(params);` |

## MuteClient Endpoints

The MuteClient instance gives access to the following `/communications/calls/{call-id}/mute` endpoints. You can get a `MuteClient` instance like so:

```typescript
const muteClient = await callsClient.mute(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action mute | `POST /communications/calls/{call-id}/mute` | `await muteClient.create(params);` |

## PlayPromptClient Endpoints

The PlayPromptClient instance gives access to the following `/communications/calls/{call-id}/playPrompt` endpoints. You can get a `PlayPromptClient` instance like so:

```typescript
const playPromptClient = await callsClient.playPrompt(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action playPrompt | `POST /communications/calls/{call-id}/playPrompt` | `await playPromptClient.create(params);` |

## RecordResponseClient Endpoints

The RecordResponseClient instance gives access to the following `/communications/calls/{call-id}/recordResponse` endpoints. You can get a `RecordResponseClient` instance like so:

```typescript
const recordResponseClient = await callsClient.recordResponse(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action recordResponse | `POST /communications/calls/{call-id}/recordResponse` | `await recordResponseClient.create(params);` |

## RedirectClient Endpoints

The RedirectClient instance gives access to the following `/communications/calls/{call-id}/redirect` endpoints. You can get a `RedirectClient` instance like so:

```typescript
const redirectClient = await callsClient.redirect(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action redirect | `POST /communications/calls/{call-id}/redirect` | `await redirectClient.create(params);` |

## RejectClient Endpoints

The RejectClient instance gives access to the following `/communications/calls/{call-id}/reject` endpoints. You can get a `RejectClient` instance like so:

```typescript
const rejectClient = await callsClient.reject(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action reject | `POST /communications/calls/{call-id}/reject` | `await rejectClient.create(params);` |

## SendDtmfTonesClient Endpoints

The SendDtmfTonesClient instance gives access to the following `/communications/calls/{call-id}/sendDtmfTones` endpoints. You can get a `SendDtmfTonesClient` instance like so:

```typescript
const sendDtmfTonesClient = await callsClient.sendDtmfTones(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendDtmfTones | `POST /communications/calls/{call-id}/sendDtmfTones` | `await sendDtmfTonesClient.create(params);` |

## SubscribeToToneClient Endpoints

The SubscribeToToneClient instance gives access to the following `/communications/calls/{call-id}/subscribeToTone` endpoints. You can get a `SubscribeToToneClient` instance like so:

```typescript
const subscribeToToneClient = await callsClient.subscribeToTone(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action subscribeToTone | `POST /communications/calls/{call-id}/subscribeToTone` | `await subscribeToToneClient.create(params);` |

## TransferClient Endpoints

The TransferClient instance gives access to the following `/communications/calls/{call-id}/transfer` endpoints. You can get a `TransferClient` instance like so:

```typescript
const transferClient = await callsClient.transfer(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action transfer | `POST /communications/calls/{call-id}/transfer` | `await transferClient.create(params);` |

## UnmuteClient Endpoints

The UnmuteClient instance gives access to the following `/communications/calls/{call-id}/unmute` endpoints. You can get a `UnmuteClient` instance like so:

```typescript
const unmuteClient = await callsClient.unmute(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unmute | `POST /communications/calls/{call-id}/unmute` | `await unmuteClient.create(params);` |

## UpdateRecordingStatusClient Endpoints

The UpdateRecordingStatusClient instance gives access to the following `/communications/calls/{call-id}/updateRecordingStatus` endpoints. You can get a `UpdateRecordingStatusClient` instance like so:

```typescript
const updateRecordingStatusClient = await callsClient.updateRecordingStatus(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action updateRecordingStatus | `POST /communications/calls/{call-id}/updateRecordingStatus` | `await updateRecordingStatusClient.create(params);` |

## OperationsClient Endpoints

The OperationsClient instance gives access to the following `/communications/calls/{call-id}/operations` endpoints. You can get a `OperationsClient` instance like so:

```typescript
const operationsClient = await callsClient.operations(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get addLargeGalleryViewOperation | `GET /communications/calls/{call-id}/operations` | `await operationsClient.list(params);` |
| Create new navigation property to operations for communications | `POST /communications/calls/{call-id}/operations` | `await operationsClient.create(params);` |
| Get addLargeGalleryViewOperation | `GET /communications/calls/{call-id}/operations/{commsOperation-id}` | `await operationsClient.get({"commsOperation-id": commsOperationId  });` |
| Delete navigation property operations for communications | `DELETE /communications/calls/{call-id}/operations/{commsOperation-id}` | `await operationsClient.delete({"commsOperation-id": commsOperationId  });` |
| Update the navigation property operations in communications | `PATCH /communications/calls/{call-id}/operations/{commsOperation-id}` | `await operationsClient.update(params);` |

## ParticipantsClient Endpoints

The ParticipantsClient instance gives access to the following `/communications/calls/{call-id}/participants` endpoints. You can get a `ParticipantsClient` instance like so:

```typescript
const participantsClient = await callsClient.participants(callId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List participants | `GET /communications/calls/{call-id}/participants` | `await participantsClient.list(params);` |
| Create new navigation property to participants for communications | `POST /communications/calls/{call-id}/participants` | `await participantsClient.create(params);` |
| Get participant | `GET /communications/calls/{call-id}/participants/{participant-id}` | `await participantsClient.get({"participant-id": participantId  });` |
| Delete participant | `DELETE /communications/calls/{call-id}/participants/{participant-id}` | `await participantsClient.delete({"participant-id": participantId  });` |
| Update the navigation property participants in communications | `PATCH /communications/calls/{call-id}/participants/{participant-id}` | `await participantsClient.update(params);` |

## MuteClient Endpoints

The MuteClient instance gives access to the following `/communications/calls/{call-id}/participants/{participant-id}/mute` endpoints. You can get a `MuteClient` instance like so:

```typescript
const muteClient = await participantsClient.mute(participantId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action mute | `POST /communications/calls/{call-id}/participants/{participant-id}/mute` | `await muteClient.create(params);` |

## StartHoldMusicClient Endpoints

The StartHoldMusicClient instance gives access to the following `/communications/calls/{call-id}/participants/{participant-id}/startHoldMusic` endpoints. You can get a `StartHoldMusicClient` instance like so:

```typescript
const startHoldMusicClient = await participantsClient.startHoldMusic(participantId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action startHoldMusic | `POST /communications/calls/{call-id}/participants/{participant-id}/startHoldMusic` | `await startHoldMusicClient.create(params);` |

## StopHoldMusicClient Endpoints

The StopHoldMusicClient instance gives access to the following `/communications/calls/{call-id}/participants/{participant-id}/stopHoldMusic` endpoints. You can get a `StopHoldMusicClient` instance like so:

```typescript
const stopHoldMusicClient = await participantsClient.stopHoldMusic(participantId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action stopHoldMusic | `POST /communications/calls/{call-id}/participants/{participant-id}/stopHoldMusic` | `await stopHoldMusicClient.create(params);` |

## InviteClient Endpoints

The InviteClient instance gives access to the following `/communications/calls/{call-id}/participants/invite` endpoints. You can get a `InviteClient` instance like so:

```typescript
const inviteClient = participantsClient.invite;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action invite | `POST /communications/calls/{call-id}/participants/invite` | `await inviteClient.create(params);` |

## LogTeleconferenceDeviceQualityClient Endpoints

The LogTeleconferenceDeviceQualityClient instance gives access to the following `/communications/calls/logTeleconferenceDeviceQuality` endpoints. You can get a `LogTeleconferenceDeviceQualityClient` instance like so:

```typescript
const logTeleconferenceDeviceQualityClient = callsClient.logTeleconferenceDeviceQuality;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action logTeleconferenceDeviceQuality | `POST /communications/calls/logTeleconferenceDeviceQuality` | `await logTeleconferenceDeviceQualityClient.create(params);` |

## GetPresencesByUserIdClient Endpoints

The GetPresencesByUserIdClient instance gives access to the following `/communications/getPresencesByUserId` endpoints. You can get a `GetPresencesByUserIdClient` instance like so:

```typescript
const getPresencesByUserIdClient = communicationsClient.getPresencesByUserId;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getPresencesByUserId | `POST /communications/getPresencesByUserId` | `await getPresencesByUserIdClient.create(params);` |

## OnlineMeetingsClient Endpoints

The OnlineMeetingsClient instance gives access to the following `/communications/onlineMeetings` endpoints. You can get a `OnlineMeetingsClient` instance like so:

```typescript
const onlineMeetingsClient = communicationsClient.onlineMeetings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get onlineMeeting | `GET /communications/onlineMeetings` | `await onlineMeetingsClient.list(params);` |
| Create new navigation property to onlineMeetings for communications | `POST /communications/onlineMeetings` | `await onlineMeetingsClient.create(params);` |
| Get onlineMeetings from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}` | `await onlineMeetingsClient.get({"onlineMeeting-id": onlineMeetingId  });` |
| Delete navigation property onlineMeetings for communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}` | `await onlineMeetingsClient.delete({"onlineMeeting-id": onlineMeetingId  });` |
| Update the navigation property onlineMeetings in communications | `PATCH /communications/onlineMeetings/{onlineMeeting-id}` | `await onlineMeetingsClient.update(params);` |

## AttendanceReportsClient Endpoints

The AttendanceReportsClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/attendanceReports` endpoints. You can get a `AttendanceReportsClient` instance like so:

```typescript
const attendanceReportsClient = await onlineMeetingsClient.attendanceReports(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceReports from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports` | `await attendanceReportsClient.list(params);` |
| Create new navigation property to attendanceReports for communications | `POST /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports` | `await attendanceReportsClient.create(params);` |
| Get attendanceReports from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.get({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Delete navigation property attendanceReports for communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.delete({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Update the navigation property attendanceReports in communications | `PATCH /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.update(params);` |

## AttendanceRecordsClient Endpoints

The AttendanceRecordsClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` endpoints. You can get a `AttendanceRecordsClient` instance like so:

```typescript
const attendanceRecordsClient = await attendanceReportsClient.attendanceRecords(meetingAttendanceReportId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceRecords from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.list(params);` |
| Create new navigation property to attendanceRecords for communications | `POST /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.create(params);` |
| Get attendanceRecords from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.get({"attendanceRecord-id": attendanceRecordId  });` |
| Delete navigation property attendanceRecords for communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.delete({"attendanceRecord-id": attendanceRecordId  });` |
| Update the navigation property attendanceRecords in communications | `PATCH /communications/onlineMeetings/{onlineMeeting-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.update(params);` |

## AttendeeReportClient Endpoints

The AttendeeReportClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/attendeeReport` endpoints. You can get a `AttendeeReportClient` instance like so:

```typescript
const attendeeReportClient = await onlineMeetingsClient.attendeeReport(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendeeReport for the navigation property onlineMeetings from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/attendeeReport` | `await attendeeReportClient.list(params);` |
| Update attendeeReport for the navigation property onlineMeetings in communications | `PUT /communications/onlineMeetings/{onlineMeeting-id}/attendeeReport` | `await attendeeReportClient.set(body, {"onlineMeeting-id": onlineMeetingId  });` |
| Delete attendeeReport for the navigation property onlineMeetings in communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/attendeeReport` | `await attendeeReportClient.delete({"onlineMeeting-id": onlineMeetingId  });` |

## SendVirtualAppointmentReminderSmsClient Endpoints

The SendVirtualAppointmentReminderSmsClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentReminderSms` endpoints. You can get a `SendVirtualAppointmentReminderSmsClient` instance like so:

```typescript
const sendVirtualAppointmentReminderSmsClient = await onlineMeetingsClient.sendVirtualAppointmentReminderSms(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendVirtualAppointmentReminderSms | `POST /communications/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentReminderSms` | `await sendVirtualAppointmentReminderSmsClient.create(params);` |

## SendVirtualAppointmentSmsClient Endpoints

The SendVirtualAppointmentSmsClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentSms` endpoints. You can get a `SendVirtualAppointmentSmsClient` instance like so:

```typescript
const sendVirtualAppointmentSmsClient = await onlineMeetingsClient.sendVirtualAppointmentSms(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action sendVirtualAppointmentSms | `POST /communications/onlineMeetings/{onlineMeeting-id}/sendVirtualAppointmentSms` | `await sendVirtualAppointmentSmsClient.create(params);` |

## RecordingsClient Endpoints

The RecordingsClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/recordings` endpoints. You can get a `RecordingsClient` instance like so:

```typescript
const recordingsClient = await onlineMeetingsClient.recordings(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get recordings from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/recordings` | `await recordingsClient.list(params);` |
| Create new navigation property to recordings for communications | `POST /communications/onlineMeetings/{onlineMeeting-id}/recordings` | `await recordingsClient.create(params);` |
| Get recordings from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}` | `await recordingsClient.get({"callRecording-id": callRecordingId  });` |
| Delete navigation property recordings for communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}` | `await recordingsClient.delete({"callRecording-id": callRecordingId  });` |
| Update the navigation property recordings in communications | `PATCH /communications/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}` | `await recordingsClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await recordingsClient.content(callRecordingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property recordings from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property recordings in communications | `PUT /communications/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` | `await contentClient.set(body, {"callRecording-id": callRecordingId  });` |
| Delete content for the navigation property recordings in communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/recordings/{callRecording-id}/content` | `await contentClient.delete({"callRecording-id": callRecordingId  });` |

## TranscriptsClient Endpoints

The TranscriptsClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/transcripts` endpoints. You can get a `TranscriptsClient` instance like so:

```typescript
const transcriptsClient = await onlineMeetingsClient.transcripts(onlineMeetingId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get transcripts from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/transcripts` | `await transcriptsClient.list(params);` |
| Create new navigation property to transcripts for communications | `POST /communications/onlineMeetings/{onlineMeeting-id}/transcripts` | `await transcriptsClient.create(params);` |
| Get transcripts from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}` | `await transcriptsClient.get({"callTranscript-id": callTranscriptId  });` |
| Delete navigation property transcripts for communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}` | `await transcriptsClient.delete({"callTranscript-id": callTranscriptId  });` |
| Update the navigation property transcripts in communications | `PATCH /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}` | `await transcriptsClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await transcriptsClient.content(callTranscriptId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property transcripts from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property transcripts in communications | `PUT /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` | `await contentClient.set(body, {"callTranscript-id": callTranscriptId  });` |
| Delete content for the navigation property transcripts in communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/content` | `await contentClient.delete({"callTranscript-id": callTranscriptId  });` |

## MetadataContentClient Endpoints

The MetadataContentClient instance gives access to the following `/communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` endpoints. You can get a `MetadataContentClient` instance like so:

```typescript
const metadataContentClient = await transcriptsClient.metadataContent(callTranscriptId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get metadataContent for the navigation property transcripts from communications | `GET /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` | `await metadataContentClient.list(params);` |
| Update metadataContent for the navigation property transcripts in communications | `PUT /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` | `await metadataContentClient.set(body, {"callTranscript-id": callTranscriptId  });` |
| Delete metadataContent for the navigation property transcripts in communications | `DELETE /communications/onlineMeetings/{onlineMeeting-id}/transcripts/{callTranscript-id}/metadataContent` | `await metadataContentClient.delete({"callTranscript-id": callTranscriptId  });` |

## CreateOrGetClient Endpoints

The CreateOrGetClient instance gives access to the following `/communications/onlineMeetings/createOrGet` endpoints. You can get a `CreateOrGetClient` instance like so:

```typescript
const createOrGetClient = onlineMeetingsClient.createOrGet;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createOrGet | `POST /communications/onlineMeetings/createOrGet` | `await createOrGetClient.create(params);` |

## PresencesClient Endpoints

The PresencesClient instance gives access to the following `/communications/presences` endpoints. You can get a `PresencesClient` instance like so:

```typescript
const presencesClient = communicationsClient.presences;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get presence | `GET /communications/presences` | `await presencesClient.list(params);` |
| Create new navigation property to presences for communications | `POST /communications/presences` | `await presencesClient.create(params);` |
| Get presence | `GET /communications/presences/{presence-id}` | `await presencesClient.get({"presence-id": presenceId  });` |
| Delete navigation property presences for communications | `DELETE /communications/presences/{presence-id}` | `await presencesClient.delete({"presence-id": presenceId  });` |
| Update the navigation property presences in communications | `PATCH /communications/presences/{presence-id}` | `await presencesClient.update(params);` |

## ClearPresenceClient Endpoints

The ClearPresenceClient instance gives access to the following `/communications/presences/{presence-id}/clearPresence` endpoints. You can get a `ClearPresenceClient` instance like so:

```typescript
const clearPresenceClient = await presencesClient.clearPresence(presenceId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action clearPresence | `POST /communications/presences/{presence-id}/clearPresence` | `await clearPresenceClient.create(params);` |

## ClearUserPreferredPresenceClient Endpoints

The ClearUserPreferredPresenceClient instance gives access to the following `/communications/presences/{presence-id}/clearUserPreferredPresence` endpoints. You can get a `ClearUserPreferredPresenceClient` instance like so:

```typescript
const clearUserPreferredPresenceClient = await presencesClient.clearUserPreferredPresence(presenceId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action clearUserPreferredPresence | `POST /communications/presences/{presence-id}/clearUserPreferredPresence` | `await clearUserPreferredPresenceClient.create(params);` |

## SetPresenceClient Endpoints

The SetPresenceClient instance gives access to the following `/communications/presences/{presence-id}/setPresence` endpoints. You can get a `SetPresenceClient` instance like so:

```typescript
const setPresenceClient = await presencesClient.setPresence(presenceId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setPresence | `POST /communications/presences/{presence-id}/setPresence` | `await setPresenceClient.create(params);` |

## SetStatusMessageClient Endpoints

The SetStatusMessageClient instance gives access to the following `/communications/presences/{presence-id}/setStatusMessage` endpoints. You can get a `SetStatusMessageClient` instance like so:

```typescript
const setStatusMessageClient = await presencesClient.setStatusMessage(presenceId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setStatusMessage | `POST /communications/presences/{presence-id}/setStatusMessage` | `await setStatusMessageClient.create(params);` |

## SetUserPreferredPresenceClient Endpoints

The SetUserPreferredPresenceClient instance gives access to the following `/communications/presences/{presence-id}/setUserPreferredPresence` endpoints. You can get a `SetUserPreferredPresenceClient` instance like so:

```typescript
const setUserPreferredPresenceClient = await presencesClient.setUserPreferredPresence(presenceId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setUserPreferredPresence | `POST /communications/presences/{presence-id}/setUserPreferredPresence` | `await setUserPreferredPresenceClient.create(params);` |
