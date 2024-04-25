# The `Application` class

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Action Planner](./ACTION-PLANNER.md)
- [Actions](./ACTIONS.md)
- [AI System](./AI-SYSTEM.md)
- [**Application class**](./APPLICATION.md)
- [Augmentations](./AUGMENTATIONS.md)
- [Data Sources](./DATA-SOURCES.md)
- [Moderator](./MODERATOR.md)
- [Planner](./PLANNER.md)
- [Powered by AI](./POWERED-BY-AI.md)
- [Prompts](./PROMPTS.md)
- [Turns](./TURNS.md)
- [User Authentication](./USER-AUTH.md)

---

The `Application` class encapsulates all the business logic for the application and comprises of two major components, the _Activity Handler System_ and the _AI System_.

## The Activity Handler System

The activity handler system is the primary way to implement bot or message extension application logic. It is a set of methods and configurations that allows you to register callbacks (known as route handlers), which will trigger based on the incoming activity. These can be in the form of a message, message reaction, or virtually any interaction within the Teams app.

Here's an example of registering a route handler that will run when the the user sends _"/login"_ to the bot:

**JS**

```js
// Listen for user to say '/login'.
app.message("/login", async (context: TurnContext, state: TurnState) => {
  await context.sendActivity(`Starting sign in flow.`);
  // start signin flow
});
```

**C#**

```cs
// Listen for user to say '/login'.
app.OnMessage("/login", async (ITurnContext turnContext, TurnState turnState, CancellationToken cancellationToken) =>
{
    await turnContext.SendActivityAsync("Starting sign in flow.", cancellationToken: cancellationToken);
        // start signin flow
});
```

**Python**

```python
# Listen for user to say '/login'.
@app.message("/login")
async def on_login(context: ActionTurnContext, state: TurnState):
    await context.send_activity("Starting sign in flow.")
    # start signin flow
```

> The `message` and `OnMessage` methods are referred to as activity or _route registration_ method.
> The `turnContext` and `turnState` parameters are present in every route handler. To learn more about them see [TURNS](TURNS.md).

The `Application` groups the route registration methods based on the specific feature groups:

| **Feature**       | **Description**                                                  |
| ----------------- | ---------------------------------------------------------------- |
| Task Modules      | Task module related activities like `task/fetch`.                |
| Message Extension | Message extension activities like `composeExtension/query`.      |
| Meetings          | Meeting activites like `application/vnd.microsoft.meetingStart`. |
| AdaptiveCards     | Adaptive card activities like `adaptiveCard/action`.             |
| General           | Generic activites like `message`.                                |

> To see all the route registration methods supported, see the migration docs ([JS](https://github.com/microsoft/teams-ai/blob/main/getting-started/MIGRATION/JS.md#activity-handler-methods) | [C#](https://github.com/microsoft/teams-ai/blob/main/getting-started/MIGRATION/DOTNET.md#activity-handler-methods)).

In general, the activity handler system is all that is needed to have a functional bot or message extension.

## The AI System

The AI System is an optional component used to plug in LLM powered experiences like user intent mapping, chaining...etc. It is configured once when orchestrating the application class. To learn more about it see [The AI System](./AI-SYSTEM.md).

## The Routing Logic

When an incoming activity reaches the server, the bot adapter handles the necessary authentication and creates a turn context object that encapsulates the activity details. Then the `Application`'s main method (`run()` in Javscript. `OnTurnAsync()` in C#) is called. Its logic can be broken down into these eight steps.

1. If configured in the application options, pulses of the `Typing` activity are sent to the user.
2. If configured in the application options, the @mention is removed from the incoming message activity.
3. The turn state is loaded using the configured turn state factory.
4. If user authentication is configured, then attempt to sign the user in. If the user is already signed in, retrieve the access token and continue to step 5. Otherwise, start the sign in flow and end the current turn.
5. The `beforeTurn` activity handler is executed. If it returns false, save turn state to storage and end the turn.
6. All routes are iterated over and if a selector function is triggered, then the corresponding route handler is executed.
7. If no route is triggered, the incoming activity is a message, and an AI System is configured, then it is invoked by calling the `AI.run()` method.
8. The `AfterTurnAsync` activity handler is executed. If it returns true, save turn state to storage.

> Note: _End the turn_ means that the main method has terminated execution and so the application has completed processing the incoming activity.

> Note: To learn about what a _turn_ is, see [TURNS](TURNS.md).

![the routing logic](../assets/routing-logic.png)

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
