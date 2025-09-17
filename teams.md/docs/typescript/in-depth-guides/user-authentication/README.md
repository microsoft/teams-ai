---
sidebar_position: 4
summary: API guide in TypeScript to implement User Authentication with SSO in Teams Apps.
---

# 🔒 User Authentication

Once you have configured your Azure Bot resource OAuth settings, as described in [User Authentication Setup](/teams/user-authentication/sso-setup), add the following code to your `App`:


## Configure the OAuth connection

```ts
const app = new App({
  oauth: { 
    defaultConnectionName: 'graph'
  }
});
```
:::tip
Make sure you use the same name you used when creating the OAuth connection in the Azure Bot Service resource.
:::

## Signing In

You must call the `signin` method inside your route handler, for example: to signin when receiving the `/signin` message:

```ts
app.message('/signin', async ({ send, signin, isSignedIn }) => {
  if (isSignedIn) {
    send('you are already signed in!');
  } else {
    await signin();
  }
});
```

## Subscribe to the SignIn event

You can subscribe to the `signin` event, that will be triggered once the OAuth flow completes.

```ts
app.event('signin', async ({ send, token }) => {
  await send(`Signed in using OAuth connection ${token.connectionName}. Please type **/whoami** to see your profile or **/signout** to sign out.`);
});
```

## Start using the graph client

From this point, you can use the `IsSignedIn` flag and the `userGraph` client to query graph, for example to reply to the `/whoami` message, or in any other route.

```ts
app.message('/whoami', async ({ send, userGraph, isSignedIn}) => {
  if (!isSignedIn) {
    await send('you are not signed in! please type **/signin** to sign in.');
    return;
  }
  const me = await userGraph.call(endpoints.me.get);
  await send(`you are signed in as "${me.displayName}" and your email is "${me.mail || me.userPrincipalName}"`);
});

app.on('message', async ({ send, activity, isSignedIn }) => {
  if (isSignedIn) {
    await send(`You said: "${activity.text}". Please type **/whoami** to see your profile or **/signout** to sign out.`);
  } else {
    await send(`You said: "${activity.text}". Please type **/signin** to sign in.`);
  }
});
```

## Singing Out

You can signout by calling the `signout` method, this will remove the token from the User Token service cache

```ts
app.message('/signout', async ({ send, signout, isSignedIn }) => {
  if (!isSignedIn) {
    await send('you are not signed in! please type **/signin** to sign in.');
    return;
  }
  await signout(); // call signout for your auth connection...
  await send('you have been signed out!');
});
```

