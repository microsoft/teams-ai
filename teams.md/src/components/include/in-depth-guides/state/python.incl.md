<!-- overview -->

The Teams SDK provides opt-in, per-turn state for storing conversation and user data across activities. State is loaded before each activity handler runs, saved automatically after the turn, and exposed through `ctx.state`.

<!-- setup -->

Set the `App` option `state` to `True`. With no storage provider configured, state uses process-local `LocalStorage` and is lost when the process restarts.

```python
from microsoft_teams.apps import App

app = App(state=True)
```

State is disabled by default. When it is disabled, `ctx.state` is `None`.

<!-- read-write -->

Use `ctx.state.conversation` and `ctx.state.user` in an activity handler. The scopes behave like dictionaries, and values must be JSON-serializable.

```python
from microsoft_teams.api import MessageActivity
from microsoft_teams.apps import ActivityContext


@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]) -> None:
    assert ctx.state is not None

    count = ctx.state.conversation.get("message_count", 0) + 1
    ctx.state.conversation["message_count"] = count

    if ctx.state.user is not None and ctx.activity.text.startswith("my name is "):
        ctx.state.user["name"] = ctx.activity.text[len("my name is "):].strip()

    name = ctx.state.user.get("name", "there") if ctx.state.user is not None else "there"
    await ctx.send(f"Hello, {name}. Message #{count}.")
```

State scopes work like Python dictionaries. Check for a value with `key in scope`, remove one with `del scope[key]`, or remove all values with `scope.clear()`. Changes inside stored lists and dictionaries are detected automatically when the turn is saved.

<!-- clearing -->

Remove a value with `del scope[key]` or clear one scope with `ctx.state.conversation.clear()` or `ctx.state.user.clear()`. To remove both scopes from the backing store:

```python
await ctx.state.delete()
```

Values written after `delete()` are saved normally at the end of the current turn.

<!-- distributed-state -->

Process-local storage is intended for development only. For production or multi-instance deployments, pass a shared `Storage[str, Any]` implementation through `StateOptions`. The state API used by handlers does not change:

```python
from typing import Any

from microsoft_teams.apps import App, StateOptions
from microsoft_teams.common import Storage


def create_app(durable_storage: Storage[str, Any]) -> App:
    return App(
        state=StateOptions(
            storage=durable_storage,
            key_prefix="my-app",
        )
    )
```

The provider stores JSON strings. Configure expiry, retries, and other provider-specific behavior on the provider itself. Each save replaces the complete scope, so concurrent turns use last-writer-wins semantics.
