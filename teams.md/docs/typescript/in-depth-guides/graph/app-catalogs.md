# App Catalogs

This page lists all the `/appCatalogs` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/appCatalogs` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/appcatalogs-list-teamsapps?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## AppCatalogsClient Endpoints

The AppCatalogsClient instance gives access to the following `/appCatalogs` endpoints. You can get a `AppCatalogsClient` instance like so:

```typescript
const appCatalogsClient = graphClient.appCatalogs;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get appCatalogs | `GET /appCatalogs` | `await appCatalogsClient.list(params);` |
| Update appCatalogs | `PATCH /appCatalogs` | `await appCatalogsClient.update(params);` |

## TeamsAppsClient Endpoints

The TeamsAppsClient instance gives access to the following `/appCatalogs/teamsApps` endpoints. You can get a `TeamsAppsClient` instance like so:

```typescript
const teamsAppsClient = appCatalogsClient.teamsApps;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List teamsApp | `GET /appCatalogs/teamsApps` | `await teamsAppsClient.list(params);` |
| Publish teamsApp | `POST /appCatalogs/teamsApps` | `await teamsAppsClient.create(params);` |
| Get teamsApps from appCatalogs | `GET /appCatalogs/teamsApps/{teamsApp-id}` | `await teamsAppsClient.get({"teamsApp-id": teamsAppId  });` |
| Delete teamsApp | `DELETE /appCatalogs/teamsApps/{teamsApp-id}` | `await teamsAppsClient.delete({"teamsApp-id": teamsAppId  });` |
| Update the navigation property teamsApps in appCatalogs | `PATCH /appCatalogs/teamsApps/{teamsApp-id}` | `await teamsAppsClient.update(params);` |

## AppDefinitionsClient Endpoints

The AppDefinitionsClient instance gives access to the following `/appCatalogs/teamsApps/{teamsApp-id}/appDefinitions` endpoints. You can get a `AppDefinitionsClient` instance like so:

```typescript
const appDefinitionsClient = await teamsAppsClient.appDefinitions(teamsAppId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get appDefinitions from appCatalogs | `GET /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions` | `await appDefinitionsClient.list(params);` |
| Update teamsApp | `POST /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions` | `await appDefinitionsClient.create(params);` |
| Get appDefinitions from appCatalogs | `GET /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions/{teamsAppDefinition-id}` | `await appDefinitionsClient.get({"teamsAppDefinition-id": teamsAppDefinitionId  });` |
| Delete navigation property appDefinitions for appCatalogs | `DELETE /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions/{teamsAppDefinition-id}` | `await appDefinitionsClient.delete({"teamsAppDefinition-id": teamsAppDefinitionId  });` |
| Publish teamsApp | `PATCH /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions/{teamsAppDefinition-id}` | `await appDefinitionsClient.update(params);` |

## BotClient Endpoints

The BotClient instance gives access to the following `/appCatalogs/teamsApps/{teamsApp-id}/appDefinitions/{teamsAppDefinition-id}/bot` endpoints. You can get a `BotClient` instance like so:

```typescript
const botClient = await appDefinitionsClient.bot(teamsAppDefinitionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get teamworkBot | `GET /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions/{teamsAppDefinition-id}/bot` | `await botClient.list(params);` |
| Delete navigation property bot for appCatalogs | `DELETE /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions/{teamsAppDefinition-id}/bot` | `await botClient.delete({"teamsAppDefinition-id": teamsAppDefinitionId  });` |
| Update the navigation property bot in appCatalogs | `PATCH /appCatalogs/teamsApps/{teamsApp-id}/appDefinitions/{teamsAppDefinition-id}/bot` | `await botClient.update(params);` |
