---
sidebar_position: 5
summary: Overview of the Teams API Client and how to use it to interact with conversations, meetings, and teams in your application.
---

# Teams API Client

Teams has a number of areas that your application has access to via its API. These are all available via the `app.api` object. Here is a short summary of the different areas:

| Area | Description |
|------|-------------|
| `conversations` | Gives your application the ability to perform activities on conversations (send, update, delete messages, etc.), or create conversations (like 1:1 chat with a user) |
| `meetings` | Gives your application access to meeting details |
| `teams` | Gives your application access to team or channel details |


An instance of the API client is passed to handlers that can be used to fetch details:

## Example

In this example, we use the API client to fetch the members in a conversation. The `api` object is passed to the activity handler in this case.

```typescript
app.on('message', async ({ activity, api }) => {
  const members = await api.conversations.members(activity.conversation.id).get();
});
```

## Proactive API

It's also possible to access the API client from outside a handler via the app instance. Here we have the same example as above, but we're access the API client via the app instance.

```typescript
import * as endpoints from '@microsoft/teams.graph-endpoints';

const res = await app.api.graph.call(endpoints.chats.getAllMessages.get);
```


