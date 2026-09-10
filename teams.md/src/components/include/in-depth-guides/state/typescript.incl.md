<!-- overview -->

The Teams SDK provides opt-in, per-turn state for storing conversation and user data across activities. State is loaded before each activity handler runs, saved automatically after the turn, and exposed through `ctx.state`.

<!-- setup -->

Set the `App` option `state` to `true`. With no storage provider configured, state uses process-local `LocalStorage` and is lost when the process restarts.

```typescript
import { App } from '@microsoft/teams.apps';

const app = new App({
  state: true,
});
```

State is disabled by default. When it is disabled, `ctx.state` is `undefined`.

:::note
Calling `addOAuthFlow()` automatically enables state because OAuth uses it to associate pending sign-ins with the correct flow. Set `state: false` explicitly to opt out.
:::

<!-- read-write -->

Use `ctx.state.conversation` and `ctx.state.user` in an activity handler. Values must be JSON-serializable.

```typescript
app.on('message', async (ctx) => {
  if (!ctx.state) {
    throw new Error('Turn state is not enabled.');
  }

  const count = (ctx.state.conversation.get<number>('messageCount') ?? 0) + 1;
  ctx.state.conversation.set('messageCount', count);

  if (ctx.state.user && ctx.activity.text?.startsWith('my name is ')) {
    ctx.state.user.set(
      'name',
      ctx.activity.text.slice('my name is '.length).trim()
    );
  }

  const name = ctx.state.user?.get<string>('name') ?? 'there';
  await ctx.reply(`Hello, ${name}. Message #${count}.`);
});
```

Use `has()`, `delete()`, and `clear()` to inspect or remove values. If you mutate an object or array returned by `get()`, call `set()` with the updated value so the scope is marked for persistence.

<!-- clearing -->

Remove a value with `delete()` or clear one scope with `ctx.state.conversation.clear()` or `ctx.state.user?.clear()`. To remove both scopes from the backing store:

```typescript
await ctx.state.delete();
```

Values written after `delete()` are saved normally at the end of the current turn.

<!-- distributed-state -->

Process-local storage is intended for development only. For production or multi-instance deployments, pass a shared `IStorage<string, string>` implementation through `state.storage`. The state API used by handlers does not change:

```typescript
import type { IStorage } from '@microsoft/teams.common';
import { App } from '@microsoft/teams.apps';

function createApp(durableStorage: IStorage<string, string>): App {
  return new App({
    state: {
      storage: durableStorage,
      keyPrefix: 'my-app',
    },
  });
}
```

The provider stores JSON strings. Configure expiry, retries, and other provider-specific behavior on the provider itself. Each save replaces the complete scope, so concurrent turns use last-writer-wins semantics.
