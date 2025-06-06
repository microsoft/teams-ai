# Application Templates

This page lists all the `/applicationTemplates` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/applicationTemplates` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/applicationtemplate?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## ApplicationTemplatesClient Endpoints

The ApplicationTemplatesClient instance gives access to the following `/applicationTemplates` endpoints. You can get a `ApplicationTemplatesClient` instance like so:

```typescript
const applicationTemplatesClient = graphClient.applicationTemplates;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List applicationTemplates | `GET /applicationTemplates` | `await applicationTemplatesClient.list(params);` |
| Get applicationTemplate | `GET /applicationTemplates/{applicationTemplate-id}` | `await applicationTemplatesClient.get({"applicationTemplate-id": applicationTemplateId  });` |

## InstantiateClient Endpoints

The InstantiateClient instance gives access to the following `/applicationTemplates/{applicationTemplate-id}/instantiate` endpoints. You can get a `InstantiateClient` instance like so:

```typescript
const instantiateClient = await applicationTemplatesClient.instantiate(applicationTemplateId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action instantiate | `POST /applicationTemplates/{applicationTemplate-id}/instantiate` | `await instantiateClient.create(params);` |
