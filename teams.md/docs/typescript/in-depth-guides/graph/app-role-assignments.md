# App Role Assignments

This page lists all the `/appRoleAssignments` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/appRoleAssignments` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-list-approleassignments?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## AppRoleAssignmentsClient Endpoints

The AppRoleAssignmentsClient instance gives access to the following `/appRoleAssignments` endpoints. You can get a `AppRoleAssignmentsClient` instance like so:

```typescript
const appRoleAssignmentsClient = graphClient.appRoleAssignments;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get entities from appRoleAssignments | `GET /appRoleAssignments` | `await appRoleAssignmentsClient.list(params);` |
| Add new entity to appRoleAssignments | `POST /appRoleAssignments` | `await appRoleAssignmentsClient.create(params);` |
| Get entity from appRoleAssignments by key | `GET /appRoleAssignments/{appRoleAssignment-id}` | `await appRoleAssignmentsClient.get({"appRoleAssignment-id": appRoleAssignmentId  });` |
| Delete entity from appRoleAssignments | `DELETE /appRoleAssignments/{appRoleAssignment-id}` | `await appRoleAssignmentsClient.delete({"appRoleAssignment-id": appRoleAssignmentId  });` |
| Update entity in appRoleAssignments | `PATCH /appRoleAssignments/{appRoleAssignment-id}` | `await appRoleAssignmentsClient.update(params);` |

## CheckMemberGroupsClient Endpoints

The CheckMemberGroupsClient instance gives access to the following `/appRoleAssignments/{appRoleAssignment-id}/checkMemberGroups` endpoints. You can get a `CheckMemberGroupsClient` instance like so:

```typescript
const checkMemberGroupsClient = await appRoleAssignmentsClient.checkMemberGroups(appRoleAssignmentId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action checkMemberGroups | `POST /appRoleAssignments/{appRoleAssignment-id}/checkMemberGroups` | `await checkMemberGroupsClient.create(params);` |

## CheckMemberObjectsClient Endpoints

The CheckMemberObjectsClient instance gives access to the following `/appRoleAssignments/{appRoleAssignment-id}/checkMemberObjects` endpoints. You can get a `CheckMemberObjectsClient` instance like so:

```typescript
const checkMemberObjectsClient = await appRoleAssignmentsClient.checkMemberObjects(appRoleAssignmentId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action checkMemberObjects | `POST /appRoleAssignments/{appRoleAssignment-id}/checkMemberObjects` | `await checkMemberObjectsClient.create(params);` |

## GetMemberGroupsClient Endpoints

The GetMemberGroupsClient instance gives access to the following `/appRoleAssignments/{appRoleAssignment-id}/getMemberGroups` endpoints. You can get a `GetMemberGroupsClient` instance like so:

```typescript
const getMemberGroupsClient = await appRoleAssignmentsClient.getMemberGroups(appRoleAssignmentId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getMemberGroups | `POST /appRoleAssignments/{appRoleAssignment-id}/getMemberGroups` | `await getMemberGroupsClient.create(params);` |

## GetMemberObjectsClient Endpoints

The GetMemberObjectsClient instance gives access to the following `/appRoleAssignments/{appRoleAssignment-id}/getMemberObjects` endpoints. You can get a `GetMemberObjectsClient` instance like so:

```typescript
const getMemberObjectsClient = await appRoleAssignmentsClient.getMemberObjects(appRoleAssignmentId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getMemberObjects | `POST /appRoleAssignments/{appRoleAssignment-id}/getMemberObjects` | `await getMemberObjectsClient.create(params);` |

## RestoreClient Endpoints

The RestoreClient instance gives access to the following `/appRoleAssignments/{appRoleAssignment-id}/restore` endpoints. You can get a `RestoreClient` instance like so:

```typescript
const restoreClient = await appRoleAssignmentsClient.restore(appRoleAssignmentId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action restore | `POST /appRoleAssignments/{appRoleAssignment-id}/restore` | `await restoreClient.create(params);` |

## GetAvailableExtensionPropertiesClient Endpoints

The GetAvailableExtensionPropertiesClient instance gives access to the following `/appRoleAssignments/getAvailableExtensionProperties` endpoints. You can get a `GetAvailableExtensionPropertiesClient` instance like so:

```typescript
const getAvailableExtensionPropertiesClient = appRoleAssignmentsClient.getAvailableExtensionProperties;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getAvailableExtensionProperties | `POST /appRoleAssignments/getAvailableExtensionProperties` | `await getAvailableExtensionPropertiesClient.create(params);` |

## GetByIdsClient Endpoints

The GetByIdsClient instance gives access to the following `/appRoleAssignments/getByIds` endpoints. You can get a `GetByIdsClient` instance like so:

```typescript
const getByIdsClient = appRoleAssignmentsClient.getByIds;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getByIds | `POST /appRoleAssignments/getByIds` | `await getByIdsClient.create(params);` |

## ValidatePropertiesClient Endpoints

The ValidatePropertiesClient instance gives access to the following `/appRoleAssignments/validateProperties` endpoints. You can get a `ValidatePropertiesClient` instance like so:

```typescript
const validatePropertiesClient = appRoleAssignmentsClient.validateProperties;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action validateProperties | `POST /appRoleAssignments/validateProperties` | `await validatePropertiesClient.create(params);` |
