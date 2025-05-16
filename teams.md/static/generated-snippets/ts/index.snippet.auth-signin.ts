app.on('message', async ({ log, signin, userGraph, isSignedIn }) => {
  if (!isSignedIn) {
    await signin({
      // Customize the OAuth card text (only applies to OAuth flow, not SSO)
      oauthCardText: 'Sign in to your account',
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
