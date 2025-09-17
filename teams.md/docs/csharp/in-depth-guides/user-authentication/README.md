---
sidebar_position: 4
summary: API guide in C# to implement User Authentication with SSO in Teams Apps.
---

# 🔒 User Authentication

Once you have configured your Azure Bot resource and OAuth settings, as described in [User Authentication Setup](/teams/user-authentication/sso-setup), add the following code to your `App`:


## Configure the OAuth connection

```cs
var builder = WebApplication.CreateBuilder(args);

var appBuilder = App.Builder()
    .AddOAuth("graph");

builder.AddTeams(appBuilder);
var app = builder.Build();
var teams = app.UseTeams();
```
:::tip
Make sure you use the same name you used when creating the OAuth connection in the Azure Bot Service resource.
:::

## Signing In

You must call the `signin` method inside your route handler, for example: to signin when receiving the `/signin` message:

```cs
teams.OnMessage("/signin", async context =>
{
    if (context.IsSignedIn)
    {
        await context.Send("you are already signed in!");
        return;
    }
    else
    {
        await context.SignIn();
    }
});
```

## Subscribe to the SignIn event

You can subscribe to the `signin` event, that will be triggered once the OAuth flow completes.

```cs
teams.OnSignIn(async (_, teamsEvent) =>
{
    var context = teamsEvent.Context;
    await context.Send($"Signed in using OAuth connection {context.ConnectionName}. Please type **/whoami** to see your profile or **/signout** to sign out.");
});
```

## Start using the graph client

From this point, you can use the `IsSignedIn` flag and the `userGraph` client to query graph, for example to reply to the `/whoami` message, or in any other route.

```cs
teams.OnMessage("/whoami", async context =>
{
    if (!context.IsSignedIn)
    {
        await context.Send("you are not signed in!. Please type **/signin** to sign in");
        return;
    }
    var me = await context.GetUserGraphClient().Me.GetAsync();
    await context.Send($"user \"{me!.DisplayName}\" signed in.");
});

teams.OnMessage(async context =>
{
    if (context.IsSignedIn)
    {
        await context.Send($"You said : {context.Activity.Text}.  Please type **/whoami** to see your profile or **/signout** to sign out.");
    }
    else
    {
        await context.Send($"You said : {context.Activity.Text}.  Please type **/signin** to sign in.");
    }
});
```

## Signing Out

You can signout by calling the `signout` method, this will remove the token from the User Token service cache

```cs
teams.OnMessage("/signout", async context =>
{
    if (!context.IsSignedIn)
    {
        await context.Send("you are not signed in!");
        return;
    }

    await context.SignOut();
    await context.Send("you have been signed out!");
});
```

