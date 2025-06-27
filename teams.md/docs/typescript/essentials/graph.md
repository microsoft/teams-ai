---
sidebar_position: 6
summary: Guide to using the Microsoft Graph API client to access Microsoft 365 data and services from your Teams AI application.
---

# Graph API Client

[Microsoft Graph](https://docs.microsoft.com/en-us/graph/overview) gives you access to the wider Microsoft 365 ecosystem. You can enrich your application with data from across Microsoft 365.

The library gives your application easy access to the Microsoft Graph API via the `@microsoft/teams.graph` package.

Microsoft Graph can be accessed by your application using its own application token, or by using the user's token. If you need access to resources that your application may not have, but your user does, you will need to use the user's scoped graph client. To grant explicit consent for your application to access resources on behalf of a user, follow the [auth guide](../in-depth-guides/user-authentication).

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
  const me = await userGraph.me.get();
  console.log(`User ID: ${me.id}`);
  console.log(`User Display Name: ${me.displayName}`);
  console.log(`User Email: ${me.mail}`);
  console.log(`User Job Title: ${me.jobTitle}`);
});
```

Here, the `userGraph` object is a scoped graph client for the user that sent the message.

:::tip
You also have access to the `appGraph` object in the activity handler. This is equivalent to `app.graph`.
:::

## The Graph Client

The Graph Client is a wrapper around the Microsoft Graph API. It provides a fluent API for accessing the Graph API and is scoped to a specific user or application. Having an understanding of [how the graph API works](https://learn.microsoft.com/en-us/graph/use-the-api) will help you make the most of the library. Microsoft Graph exposes resources using the OData standard, and the graph client exposes type-safe access to these resources.

For example, to get the `id` of the chat instance between a user and an app, [Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/userscopeteamsappinstallation-get-chat?view=graph-rest-1.0&tabs=http) exposes it via:

```
GET /users/{user-id | user-principal-name}/teamwork/installedApps/{app-installation-id}/chat
```

The equivalent using the graph client would look like this:

```ts
const chat = await userGraph.teamwork(user.id).installedApps.chat(appInstallationId).get({
  "user-id": user.id,
  "userScopeTeamsAppInstallation-id": appInstallationId,
  "$select": ["id"],
})
```

Here, the client takes care of using the correct token, provides helpful hints via intellisense, and performs the fetch request for you.

## Currently exposed Graph clients

The following clients are currently exposed:

| Client Name | Graph endpoint | Description |
|-------------|----------------|-------------|
| appCatalogs | [/appCatalogs](https://learn.microsoft.com/en-us/graph/api/appcatalogs-list-teamsapps?view=graph-rest-1.0) | Apps from Teams App Catalog |
| appRoleAssignments | [/appRoleAssignments](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-list-approleassignments?view=graph-rest-1.0) | List app role assignments |
| applicationTemplates | [/applicationTemplates](https://learn.microsoft.com/en-us/graph/api/resources/applicationtemplate?view=graph-rest-1.0) | Application in the Microsoft Entra App Gallery |
| applications | [/applications](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0) | Application Resources |
| chats | [/chats](https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http) | Chat resources between users |
| communications | [/communications](https://learn.microsoft.com/en-us/graph/api/application-post-calls?view=graph-rest-1.0) | Calls and Online meetings |
| employeeExperience | [/employeeExperience](https://learn.microsoft.com/en-us/graph/api/resources/engagement-api-overview?view=graph-rest-1.0) |  Employee Experience and Engagement |
| me | [/me](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http) | Same as `/users` but scoped to one user (who is making the request) |
| teams | [/teams](https://learn.microsoft.com/en-us/graph/api/resources/team?view=graph-rest-1.0) | A Team resource  |
| teamsTemplates | [/teamsTemplates](https://learn.microsoft.com/en-us/microsoftteams/get-started-with-teams-templates) | A Team Template resource |
| teamwork | [/teamwork](https://learn.microsoft.com/en-us/graph/api/resources/teamwork?view=graph-rest-1.0) | A range of Microsoft Teams functionalities |
| users | [/users](https://learn.microsoft.com/en-us/graph/api/resources/users?view=graph-rest-1.0) | A user resource |
