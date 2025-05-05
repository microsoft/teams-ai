# Teams API Client

Teams has a number of areas that your application has access to via its API. These are all available via the `app.api` object. Here is a short summary of the different areas:

| Area | Description |
|------|-------------|
| `conversations` | Gives your application the ability to perform activities on conversations (send, update, delete messages, etc.), or create conversations (like 1:1 chat with a user) |
| `meetings` | Gives your application access to meeting details |
| `teams` | Gives your application access to team or channel details |


An instance of the Api Client is passed to handlers that can be used to fetch details:

## Example

In this example, we use the api client to fetch the members in a conversation.

```typescript
app.on('message', async ({ activity, api }) => {
  const members = await api.conversations.members(activity.conversation.id).get();
});
```
