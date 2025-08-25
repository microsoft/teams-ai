---
sidebar_position: 6
---

# Graph API Client

[Microsoft Graph](https://docs.microsoft.com/en-us/graph/overview) gives you access to the wider Microsoft 365 ecosystem. You can enrich your application with data from across Microsoft 365.

The library gives your application easy access to the Microsoft Graph API via the `@microsoft/teams.graph` and `@microsoft/teams.graph-endpoints` packages.

:::note
If you're migrating from an earlier preview version of the Teams AI v2 library, please see the [migration guide](../migrations/preview/) for details on breaking changes.
:::

Microsoft Graph can be accessed by your application using its own application token, or by using the user's token. If you need access to resources that your application may not have, but your user does, you will need to use the user's scoped graph client. To grant explicit consent for your application to access resources on behalf of a user, follow the [auth guide](../in-depth-guides/user-authentication).

To access the graph using the Graph using the app, you may use the `app.graph` object to call the endpoint of your choice. 

```typescript
import * as endpoints from '@microsoft/teams.graph-endpoints';

// Equivalent of https://learn.microsoft.com/en-us/graph/api/user-get
// Gets the details of the bot-user
app.graph.call(endpoints.me.get).then((user) => {
  console.log(`User ID: ${user.id}`);
  console.log(`User Display Name: ${user.displayName}`);
  console.log(`User Email: ${user.mail}`);
  console.log(`User Job Title: ${user.jobTitle}`);
});
```

You can also access the graph using the user's token from within a message handler via the `userGraph` prop.

```typescript
import * as endpoints from '@microsoft/teams.graph-endpoints';

// Gets details of the current user
app.on('message', async ({ activity, userGraph }) => {
  const me = await userGraph.call(endpoints.me.get);
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

The Graph Client provides a straight-forward `call` method to interact with Microsoft Graph and issue requests scoped to a specific user or application. Paired with the Graph Endpoints packages, it offers discoverable and type-safe access to the vast Microsoft Graph API surface.

Having an understanding of [how the graph API works](https://learn.microsoft.com/en-us/graph/use-the-api) will help you make the most of the library. For example, to get the `id` of the chat instance between a user and an app, [Microsoft Graph](https://learn.microsoft.com/en-us/graph/api/userscopeteamsappinstallation-get-chat?view=graph-rest-1.0&tabs=http) exposes it via:

```
GET /users/{user-id | user-principal-name}/teamwork/installedApps/{app-installation-id}/chat
```

The equivalent using the graph client would look like this:

```ts
import { users } from '@microsoft/teams.graph-endpoints';

const chat = await userGraph.call(users.teamwork.installedApps.chat.get, {
  "user-id": user.id,
  "userScopeTeamsAppInstallation-id": appInstallationId,
  "$select": ["id"],
});
```

Here, the client takes care of using the correct token, provides helpful hints via intellisense, and performs the fetch request for you.

## Additional resources
Microsoft Graph offers an extensive and thoroughly documented API surface. These two essential resources will serve as your go-to references for any Graph development work:
 - The [Microsoft Graph Rest API reference documentation](https://learn.microsoft.com/en-us/graph/api/overview) gives details for each API, including permissions requirements.
 - The [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) lets you discover and test drive APIs.

In addition, the following endpoints may be especially interesting to Teams developers:

| Graph endpoints | Description |
|----------------|-------------|
| [appCatalogs](https://learn.microsoft.com/en-us/graph/api/appcatalogs-list-teamsapps?view=graph-rest-1.0) | Apps in the Teams App Catalog |
| [appRoleAssignments](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-list-approleassignments?view=graph-rest-1.0) | App role assignments |
| [applicationTemplates](https://learn.microsoft.com/en-us/graph/api/resources/applicationtemplate?view=graph-rest-1.0) | Applications in the Microsoft Entra App Gallery |
| [applications](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0) | Application resources |
| [chats](https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http) | Chat resources between users |
| [communications](https://learn.microsoft.com/en-us/graph/api/application-post-calls?view=graph-rest-1.0) | Calls and Online meetings |
| [employeeExperience](https://learn.microsoft.com/en-us/graph/api/resources/engagement-api-overview?view=graph-rest-1.0) | Employee Experience and Engagement |
| [me](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http) | Same as `/users` but scoped to one user (who is making the request) |
| [teams](https://learn.microsoft.com/en-us/graph/api/resources/team?view=graph-rest-1.0) | Team resources in Microsoft Teams |
| [teamsTemplates](https://learn.microsoft.com/en-us/microsoftteams/get-started-with-teams-templates) | Templates used to create teams |
| [teamwork](https://learn.microsoft.com/en-us/graph/api/resources/teamwork?view=graph-rest-1.0) | A range of Microsoft Teams functionalities |
| [users](https://learn.microsoft.com/en-us/graph/api/resources/users?view=graph-rest-1.0) | User resources |

