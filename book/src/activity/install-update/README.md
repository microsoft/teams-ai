# Activity: Install Update

Installation update activities represent an installation or uninstallation of a bot within an organizational unit (such as a customer tenant or "team") of a channel. Installation update activities generally do not represent adding or removing a channel.

<!-- langtabs-start -->
```typescript
app.on('installationUpdate', async ({ activity }) => {});
```
<!-- langtabs-end -->

## Schema

Installation update activities are identified by a `type` value of `installationUpdate`.

`A5700`: Channels MAY send installation activities when a bot is added to or removed from a tenant, team, or other organization unit within the channel.

`A5701`: Channels SHOULD NOT send installation activities when the bot is installed into or removed from a channel.

### Action

The `action` field describes the meaning of the installation update activity. The value of the `action` field is a string. Only values of `add` and `remove` are defined.
