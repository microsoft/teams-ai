# Activity: Installation Updates

The `installationUpdate` event is sent to the bot when a bot is added or removed from a conversation thread

## Installation add event

```typescript
app.on('install.add', async ({ activity }) => {});
```

- `install.add` - A user has installed the app.

## Installation remove event

```typescript
app.on('install.remove', async ({ activity }) => {});
```

- `install.remove` - A user has uninstalled the app.

## Resources

- [Microsoft Learn: Installation Events](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/subscribe-to-conversation-events#installation-update-event)
