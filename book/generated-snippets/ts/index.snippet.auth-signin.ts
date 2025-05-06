app.on('message', async ({ log, signin, userGraph, isSignedIn }) => {
  if (!isSignedIn) {
    await signin({
      // optional. This will work with explicit oauth.
      oauthCardText: 'Sign in to your account',
      // optional. This will work with explicit oauth.
      signInButtonText: 'Sign in' 
    }); // call signin for your auth connection...
    return;
  }

  const me = await userGraph.me.get();
  log.info(`user "${me.displayName}" already signed in!`);
});

app.event('signin', async ({ send, userGraph, token }) => {
  const me = await userGraph.me.get();
  await send(`user "${me.displayName}" signed in. Here's the token: ${JSON.stringify(token)}`);
});
