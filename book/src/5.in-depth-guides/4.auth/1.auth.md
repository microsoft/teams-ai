# 📖 [🔒 User Authentication](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/add-authentication)

Prompting the user to sign in using an `OAuth` connection has
never been easier! Just use the `signin` method to send the request
and the listen to the `signin` event to handle the token result.

```typescript
app.on('message', async ({ signin, send, isSignedIn }) => {
  if (!isSignedIn) {
    await signin(); // call signin for your auth connection...
    return;
  }

  await send('you are already signed in!');
});

app.event('signin', async ({ token }) => {
  // do something with the token...
});
```
