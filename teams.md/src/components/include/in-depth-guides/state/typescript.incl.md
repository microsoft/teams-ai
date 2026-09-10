<!-- setup-example -->

```typescript
import { App } from '@microsoft/teams.apps';

const app = new App({
  state: true,
});
```

<!-- oauth-note -->

Registering an OAuth flow with `addOAuthFlow()` automatically enables state so pending sign-ins can be associated with the correct flow. Set `state: false` explicitly to fall back to process-local in-memory maps.

<!-- read-write-example -->

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

<!-- clear-example -->

```typescript
await ctx.state.delete();
```

<!-- distributed-example -->

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
