# Turns - Turn Context and Turn State

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Action Planner](./ACTION-PLANNER.md)
- [Actions](./ACTIONS.md)
- [AI System](./AI-SYSTEM.md)
- [Application class](./APPLICATION.md)
- [Augmentations](./AUGMENTATIONS.md)
- [Data Sources](./DATA-SOURCES.md)
- [Moderator](./MODERATOR.md)
- [Planner](./PLANNER.md)
- [Powered by AI](./POWERED-BY-AI.md)
- [Prompts](./PROMPTS.md)
- [**Turns**](./TURNS.md)
- [User Authentication](./USER-AUTH.md)

---

In a conversation, people often speak one-at-a-time, taking turns speaking. With a bot, it generally reacts to user input. Within the Teams AI Library, a turn consists of the user's incoming activity to the bot and any activity the bot sends back to the user as an immediate response. You can think of a _turn_ as the processing associated with the bot receiving a given activity.

In each turn the _turn context_ and the _turn state_ are configured to manage conversational data.

### Turn Context

The turn context object provides information about the activity such as the sender and receiver, the channel, and other data needed to process the activity.

The turn context is one of the most important abstractions in the SDK. Not only does it carry the inbound activity to all the middleware components and the application logic but it also provides the mechanism whereby the components and the bot logic can send outbound activities.

#### Example

The turn context object is accessible from the activity handler or an action. Here's how to use it send a message back to the user in an activity handler:

##### C#

```cs
app.OnActivity(ActivityTypes.Message, async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
{
    // Extract user's message
    string message = turnContext.Activity.Text;
    await turnContext.sendActivity(`You said: ${message}`);
})
```

##### JS/TS

```ts
app.activity(ActivityTypes.Message, async (context: TurnContext, state: ApplicationTurnState) => {
  // Extract user's message
  let message = context.activity.text;
  await context.sendActivity(`You said: ${message}`);
});
```

##### Python

```python
@app.activity("message")
async def on_message(context: TurnContext, state: TurnState):
    # Extract user's message
    message = context.activity.text
    await context.send_activity(f"You said: {message}")
    return True
```

### Turn State

The turn state object stores cookie-like data for the current turn. Just like the turn context, it is carried through the entire application logic, including the activity handlers and the AI System. Unlike the turn context, the turn state is not fixed and is meant to be configured to each application-specific use case. It is common for apps to have conversation state, user state, and temp (temporary) state, but as a developer you can add or remove state objects to fit your needs.

It is used to store information like the user's message, the conversation history, and any custom data configured by the application code.

#### Example

This is how a bot can keep track of the number of messages send by the user using the turn state:

##### C#

```cs
app.OnActivity(ActivityTypes.Message, async (ITurnContext turnContext, AppState turnState, CancellationToken cancellationToken) =>
{
    int count = turnState.Conversation.MessageCount;
    // Increment count state.
    turnState.Conversation.MessageCount = ++count;

    // Send a message back to the user....
});
```

##### JS/TS

```ts
app.activity(ActivityTypes.Message, async (context: TurnContext, state: ApplicationTurnState) => {
  let count = state.conversation.value.count ?? 0;
  // Increment count state
  state.conversation.value.count += 1;

  // Send a message back to the user....
});
```

##### Python

```python
@app.activity("message")
async def on_message(context: TurnContext, state: AppTurnState):
    count = state.conversation.count
    # Increment count state
    state.conversation.count += 1

    # Send a message back to the user....
    return True
```

### Appendix

<details>
<summary>What happens when the user sends a message to the bot?</summary>
<br>

When a message is sent by the user it is routed to the bots `HTTP POST` endpoint `/api/messages`, which
starts the routing process.

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
