# Graph API Client

The Graph Client is a wrapper around the Microsoft Graph API. It provides a fluent API for accessing the Graph API and is scoped to a specific user or application. Having an understanding of [how the graph API works](https://learn.microsoft.com/en-us/graph/use-the-api) will help you make the most of the library. Microsoft Graph exposes resources using the OData standard, and the graph client exposes type-safe access to these resources.

The Microsoft Graph API surface is vast, and this Graph API Client supports a subset of the full functionality to cover the most common scenarios. Use the following table to find details on which endpoints are supported as well as links to the official documentation for each endpoint.

| Client property | Graph endpoints | Description  | 
|--|--|--|
| [appCatalogs](app-catalogs.md) | [/appCatalogs](https://learn.microsoft.com/en-us/graph/api/appcatalogs-list-teamsapps?view=graph-rest-1.0) | Apps from Teams App Catalog  |
| [applications](applications.md) | [/applications](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0) | Application Resources  |
| [applicationTemplates](application-templates.md) | [/applicationTemplates](https://learn.microsoft.com/en-us/graph/api/resources/applicationtemplate?view=graph-rest-1.0) | Application in the Microsoft Entra App Gallery  |
| [appRoleAssignments](app-role-assignments.md) | [/appRoleAssignments](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-list-approleassignments?view=graph-rest-1.0) | List app role assignments  |
| [chats](chats.md) | [/chats](https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http) | Chat resources between users  |
| [communications](communications.md) | [/communications](https://learn.microsoft.com/en-us/graph/api/application-post-calls?view=graph-rest-1.0) | Calls and Online meetings  |
| [employeeExperience](employee-experience.md) | [/employeeExperience](https://learn.microsoft.com/en-us/graph/api/resources/engagement-api-overview?view=graph-rest-1.0) | Employee Experience and Engagement  |
| [me](me.md) | [/me](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http) | Same as `/users` but scoped to one user (who is making the request)  |
| [sites](sites.md) | [/sites](https://learn.microsoft.com/en-us/graph/api/resources/site?view=graph-rest-1.0) | SharePoint Sites features  |
| [solutions](solutions.md) | [/solutions](https://learn.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0) | Solutions in Microsoft Graph  |
| [teams](teams.md) | [/teams](https://learn.microsoft.com/en-us/graph/api/resources/team?view=graph-rest-1.0) | A Team resource  |
| [teamsTemplates](teams-templates.md) | [/teamsTemplates](https://learn.microsoft.com/en-us/microsoftteams/get-started-with-teams-templates) | A Team Template resource  |
| [teamwork](teamwork.md) | [/teamwork](https://learn.microsoft.com/en-us/graph/api/resources/teamwork?view=graph-rest-1.0) | A range of Microsoft Teams functionalities  |
| [users](users.md) | [/users](https://learn.microsoft.com/en-us/graph/api/resources/users?view=graph-rest-1.0) | A user resource  |
