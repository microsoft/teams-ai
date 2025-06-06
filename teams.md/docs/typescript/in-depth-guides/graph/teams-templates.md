# Teams Templates

This page lists all the `/teamsTemplates` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/teamsTemplates` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/microsoftteams/get-started-with-teams-templates), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## TeamsTemplatesClient Endpoints

The TeamsTemplatesClient instance gives access to the following `/teamsTemplates` endpoints. You can get a `TeamsTemplatesClient` instance like so:

```typescript
const teamsTemplatesClient = graphClient.teamsTemplates;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get entities from teamsTemplates | `GET /teamsTemplates` | `await teamsTemplatesClient.list(params);` |
| Add new entity to teamsTemplates | `POST /teamsTemplates` | `await teamsTemplatesClient.create(params);` |
| Get entity from teamsTemplates by key | `GET /teamsTemplates/{teamsTemplate-id}` | `await teamsTemplatesClient.get({"teamsTemplate-id": teamsTemplateId  });` |
| Delete entity from teamsTemplates | `DELETE /teamsTemplates/{teamsTemplate-id}` | `await teamsTemplatesClient.delete({"teamsTemplate-id": teamsTemplateId  });` |
| Update entity in teamsTemplates | `PATCH /teamsTemplates/{teamsTemplate-id}` | `await teamsTemplatesClient.update(params);` |
