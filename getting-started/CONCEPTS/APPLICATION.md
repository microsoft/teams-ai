# The `Application` class

The `Application` class encapsulates all the business logic for the application and it comprises of two major components, the Activity Handler system and the AI module.


## The Activity Handler system

The activity handler system is the set of methods and configuration that allows you to register callbacks (known as route handlers) which will trigger based on the incomming activity. These can be in the form of a message, message reaction, or virtually any interaction with the Teams app. The method determines the incomming activity for which the callback would be triggered.

Here's an example of registering a route handler that will trigger when the the user sends *"/login"* to the bot:

**JS**
```js
// Listen for user to say '/login'.
app.message('/login', async (context: TurnContext, state: TurnState) => {
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
> The `turnContext` and `turnState` parameters are present in every route handler. To learn more about them see [TURNS](TURNS.md).
> The `message` and `OnMessage` methods are referred to as activity or *route registration* method. 

The `Application` groups the route registration methods based on the specific feature groups: 


| **Feature**       | **Description**                                                                         |
|-------------------|-----------------------------------------------------------------------------------------|
| Task Modules      | route registration methods for task module related activities like `task/fetch`.        |
| Message Extension | route registration methods for message extension activities like `composeExtension/query`.      |
| Meetings          | route registration methods for meeting activites like `application/vnd.microsoft.meetingStart`. |
| AdaptiveCards     | route registration methods for adaptive card activities like `adaptiveCard/action`.             |
| General           | route registration methods for generic activites like `message`.                        |

> To see all the route registration methods supported, see the migration docs ([JS](https://github.com/microsoft/teams-ai/blob/main/getting-started/MIGRATION/JS.md#activity-handler-methods)/[C#](https://github.com/microsoft/teams-ai/blob/main/getting-started/MIGRATION/DOTNET.md#activity-handler-methods)).

In general, the activity handler system is all that is needed to have a functional bot or message extension. 

## The AI Module
The AI module is an optional component used to plug in LLM powered experiences like user intent mapping, chaining...etc. It is configured once when orchestrating the application class. To learn more about it see [The AI Module](.AI-MODULE.md).

## The Routing Logic

When an incoming activity reaches the server, the bot adapter handles the necessary authentication and creates a turn context object that encapsulates the activity details. It then calls `Application`'s main method (`run()` in Javscript. `OnTurnAsync()` in C#). It is called for every incomming activity. Here's what happens:

1. If configured in the application options, pulses of the `Typing` activity are sent to the user.
2. If configured in the application options, the @mention is removed from the incoming message activity.
3. The turn state is loaded using the configured turn state factory.
4. If user authentication is configured, then attemp to sign the user in. If there user is already signed in, retrieve the access token and continue to step 5. Otherwise, start the sign in flow and end the current turn.
5. The `beforeTurn` activity handler is executed. If it returns false, save turn state to storage and end the turn.
6. All the routes are iterated over and if a selector function is triggered, then the corresponding route handler is executed.
7. If no route is triggered, the incomming activity is a message, and the AI module is configured, then it is invoked by calling the `AI.run()` method.
8. The `AfterTurnAsync` activity handler is executed. If it return true, save turn state to storage.

> Note: To learn about what a *turn* is, see [TURNS](TURNS.md).