# User Authentication

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
- [Turns](./TURNS.md)
- [**User Authentication**](./USER-AUTH.md)

---

A critical feature of any Teams application is the ability to access relevent user data from third party services, for example a DevOps bot being able to access the user's work items from Azure DevOps. To do this the bot or message extension has to be able to authenticate the user to third party services. In the Bot Framework SDK, configuring user authenticate is incredibly hard to implement and even more so to debug potential issues. The Teams AI library has user authentication built-in to the `Application` class and exposes a simple interface to configuring it for both bots and message extensions.

## Quickstart

To dive right in and test out a bot or message extension see the [user authentication samples](../SAMPLES.md#user-authentication-samples). They are relatively straight forward to set up given the right tools installed. If you have not tested a sample before it is recommnded to first follow the [quickstart guide](../QUICKSTART.md).

## Configuring the application

Adding user authentication is as simple as configuring it in the `Application` class constructor or builder:

**C#**

```cs
AuthenticationOptions<AppState> options = new();
options.AddAuthentication("graph", new OAuthSettings()
    {
        ConnectionName = config.OAUTH_CONNECTION_NAME,
        Title = "Sign In",
        Text = "Please sign in to use the bot.",
    }
);

Application<AppState> app = new ApplicationBuilder<AppState>()
    .WithStorage(storage)
    .WithTurnStateFactory(() => new AppState())
    .WithAuthentication(adapter, options)
    .Build();
```

**Javascript**

```js
const app = new ApplicationBuilder<ApplicationTurnState>()
    .withStorage(storage)
    .withAuthentication(adapter, {
        settings: {
            graph: {
                connectionName: process.env.OAUTH_CONNECTION_NAME ?? '',
                title: 'Sign in',
                text: 'Please sign in to use the bot.',
            }
        }
    })
    .build();
```

The `adapter` is the configured `BotAdapter` for the application. The second parameter in the `.withAuthentication` is the authentication options.

The `settings` property is an object of all the different services that the user could be authenticated to, called _connections_. The above example has the `graph` connection which specifies configurations to authenticate the user to Microsoft Graph. The name `graph` is arbitrary and is used when specifying which service to sign the user in and out of.

The `connectionName` property is what you configure in the Azure Bot Resource, see [Configure OAuth connection for your bot resource](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/bot-sso-register-aad?tabs=windows#configure-oauth-connection-for-your-bot-resource).

The `text` property is the titie and the `text` property is the body of the sign in card sent to the user.

## Auto sign in

With this configuration, the bot will attempt to authenticate the user when they try to interact with it. To control when for which incoming activities the bot should authenticate the user, you can specify configure the auto sign in property in the options.

**C#**

```cs
options.AutoSignIn = (ITurnContext turnContext, CancellationToken cancellationToken) =>
 {
     string command = (turnContext.Activity.Value as JObject).Value<string>("commandId");
     bool signOutActivity = command == "signOutCommand";
     if (signOutActivity)
     {
         return Task.FromResult(true);
     }
     return Task.FromResult(false);
 };
```

**JavaScript**

```ts
.withAuthentication(adapter, {
    settings: { /* Settings options here... */ },
    autoSignIn: (context: TurnContext) => {
        const signOutActivity = context.activity?.value.commandId === 'signOutCommand';
        if (signOutActivity) {
            return Promise.resolve(false);
        }

        return Promise.resolve(true);
    }
})
```

The `autoSignIn` property takes a callback that triggers the sign in flow if it returns true. It depends on the turn context from which the incomming activity details can be extracted. In the above example, the library will not attempt to sign the user in if the incoming activity `commandId` is _"signOutCommand"_.

This is useful if the user should be signed in by default before attempting to interacting with the bot in general.

## Manual Sign In

If the user should only be authenticated in certain scenarios, you can disable auto sign in by having the callback always return false and trigger authentication manually.

Here's an example of manually triggering sign in flow in an activity or action handler:

**C#**

```cs
string? token = await app.GetTokenOrStartSignInAsync(turnContext, turnState, "graph", cancellationToken);
if (token == null || token.Length == 0)
{
    await turnContext.SendActivityAsync("You have to be signed in to fulfill this request. Starting sign in flow...");
}
```

**Javascript**

```ts
const token = await app.getTokenOrStartSignIn(context, state, "graph");
if (!token) {
  await context.sendActivity("You have to be signed in to fulfill this request. Starting sign in flow...");
}
```

The `app.getTokenOrStartSignIn` method will attempt to get the access token if the user is already signed in. Otherwise, the sign in flow will be triggered. The string `'graph'` below references the connection name set by the user in the `settings` object of the authentication options.

If multiple settings are configured, then the user can be authenticated into multiple services through the manual triggering of the sign in flow.

**Note:** Once the sign in flow completes when triggered from a message activity or an action handler, the application is NOT redirected back to its previous task. This means that if user authentication is triggered through a message extension, then the same activity will be sent again to the bot after sign in completes. But if sign in is triggered when the incoming activity is a message then the same activity will NOT be sent again to the bot after sign in completes.

## Enable Single Sign-On (SSO)

With Single sign-on (SSO) in Teams, users have the advantage of using Teams to access bot or message extension apps. After logging into Teams using Microsoft or Microsoft 365 account, app users can use your app without needing to sign in again. Your app is available to app users on any device with access granted through Microsoft Entra ID. This means that SSO works only if the user is being authenticated with Azure Active Directory (AAD). It will not work with other authentication providers like Facebook, Google, etc.

Here's an example of enabling SSO in the `OAuthSettings`:

**Javascript**

```js
const app = new ApplicationBuilder<ApplicationTurnState>()
    .withStorage(storage)
    .withAuthentication(adapter, {
        settings: {
            graph: {
                connectionName: process.env.OAUTH_CONNECTION_NAME ?? '',
                title: 'Sign in',
                text: 'Please sign in to use the bot.',
                enableSso: true // set this to true to enable SSO
            }
        }
    })
    .build();
```

## Handling sign in success or failure

To handle the event when the user has signed in successfully or failed to sign in, simply register corresponding handler:

**C#**

```cs
app.Authentication.Get("graph").OnUserSignInSuccess(async (context, state) =>
{
    // Successfully logged in
    await context.SendActivityAsync("Successfully logged in");
    await context.SendActivityAsync($"Token string length: {state.Temp.AuthTokens["graph"].Length}");
    await context.SendActivityAsync($"This is what you said before the AuthFlow started: {context.Activity.Text}");
});

app.Authentication.Get("graph").OnUserSignInFailure(async (context, state, ex) =>
{
    // Failed to login
    await context.SendActivityAsync("Failed to login");
    await context.SendActivityAsync($"Error message: {ex.Message}");
});
```

**Javascript**

```ts
app.authentication.get("graph").onUserSignInSuccess(async (context: TurnContext, state: ApplicationTurnState) => {
  // Successfully logged in
  await context.sendActivity("Successfully logged in");
  await context.sendActivity(`Token string length: ${state.temp.authTokens["graph"]!.length}`);
  await context.sendActivity(`This is what you said before the AuthFlow started: ${context.activity.text}`);
});

app.authentication
  .get("graph")
  .onUserSignInFailure(async (context: TurnContext, _state: ApplicationTurnState, error: AuthError) => {
    // Failed to login
    await context.sendActivity("Failed to login");
    await context.sendActivity(`Error message: ${error.message}`);
  });
```

## Sign out a user

You can also sign a user out of connection:

**C#**

```cs
await app.Authentication.SignOutUserAsync(context, state, "graph", cancellationToken);
```

**Javascript**

```js
await app.authentication.signOutUser(context, state, "graph");
```

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
