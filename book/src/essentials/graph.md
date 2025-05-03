# Graph Access

[Microsoft Graph](https://docs.microsoft.com/en-us/graph/overview) gives you access to the wider Microsoft 365 ecosystem. You can enrich your application with data from across Microsoft 365.

The library gives your application easy access to the Microsoft Graph API via the `@microsoft/teams.graph` package.

Microsoft Graph can be accessed by your application using its own application token, or by using the user's token. If you need access to resources that your application may not have, but your user does, you will need to use the user's scoped graph client.

To access the graph using the Graph using the app, you may use the `app.graph` object. 

```typescript
// Equivalent of https://learn.microsoft.com/en-us/graph/api/user-get
// Gets the details of the bot-user
app.graph.me.get().then((user) => {
  console.log(`User ID: ${user.id}`);
  console.log(`User Display Name: ${user.displayName}`);
  console.log(`User Email: ${user.mail}`);
  console.log(`User Job Title: ${user.jobTitle}`);
});
```

To access the graph using the user's token, you need to do this as part of a message handler:

```typescript
app.on('message', async ({ activity, userGraph }) => {
  const graph = await userGraph.me.get();
  console.log(`User ID: ${graph.id}`);
  console.log(`User Display Name: ${graph.displayName}`);
  console.log(`User Email: ${graph.mail}`);
  console.log(`User Job Title: ${graph.jobTitle}`);
});
```

Here, the `userGraph` object is a scoped graph client for the user that sent the message.

> [!NOTE]
> You also have access to the `appGraph` object in the activity handler. This is equivalent to `app.graph`.

## Currently exposed Graph clients

The following clients are currently exposed:

/appCatalogs
/appRoleAssignments
/applicationTemplates
/applications
/chats
/communications
/employeeExperience
/me
/solutions
/teams
/teamsTemplates
/teamwork
/users