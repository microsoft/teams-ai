# Sites

This page lists all the `/sites` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/sites` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/site?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## SitesClient Endpoints

The SitesClient instance gives access to the following `/sites` endpoints. You can get a `SitesClient` instance like so:

```typescript
const sitesClient = graphClient.sites;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List sites | `GET /sites` | `await sitesClient.list(params);` |
| Get a site resource | `GET /sites/{site-id}` | `await sitesClient.get({"site-id": siteId  });` |
| Update entity in sites | `PATCH /sites/{site-id}` | `await sitesClient.update(params);` |

## AnalyticsClient Endpoints

The AnalyticsClient instance gives access to the following `/sites/{site-id}/analytics` endpoints. You can get a `AnalyticsClient` instance like so:

```typescript
const analyticsClient = await sitesClient.analytics(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get analytics from sites | `GET /sites/{site-id}/analytics` | `await analyticsClient.list(params);` |
| Delete navigation property analytics for sites | `DELETE /sites/{site-id}/analytics` | `await analyticsClient.delete({"site-id": siteId  });` |
| Update the navigation property analytics in sites | `PATCH /sites/{site-id}/analytics` | `await analyticsClient.update(params);` |

## AllTimeClient Endpoints

The AllTimeClient instance gives access to the following `/sites/{site-id}/analytics/allTime` endpoints. You can get a `AllTimeClient` instance like so:

```typescript
const allTimeClient = analyticsClient.allTime;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get allTime from sites | `GET /sites/{site-id}/analytics/allTime` | `await allTimeClient.list(params);` |

## ItemActivityStatsClient Endpoints

The ItemActivityStatsClient instance gives access to the following `/sites/{site-id}/analytics/itemActivityStats` endpoints. You can get a `ItemActivityStatsClient` instance like so:

```typescript
const itemActivityStatsClient = analyticsClient.itemActivityStats;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get itemActivityStats from sites | `GET /sites/{site-id}/analytics/itemActivityStats` | `await itemActivityStatsClient.list(params);` |
| Create new navigation property to itemActivityStats for sites | `POST /sites/{site-id}/analytics/itemActivityStats` | `await itemActivityStatsClient.create(params);` |
| Get itemActivityStats from sites | `GET /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}` | `await itemActivityStatsClient.get({"itemActivityStat-id": itemActivityStatId  });` |
| Delete navigation property itemActivityStats for sites | `DELETE /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}` | `await itemActivityStatsClient.delete({"itemActivityStat-id": itemActivityStatId  });` |
| Update the navigation property itemActivityStats in sites | `PATCH /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}` | `await itemActivityStatsClient.update(params);` |

## ActivitiesClient Endpoints

The ActivitiesClient instance gives access to the following `/sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities` endpoints. You can get a `ActivitiesClient` instance like so:

```typescript
const activitiesClient = await itemActivityStatsClient.activities(itemActivityStatId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get activities from sites | `GET /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities` | `await activitiesClient.list(params);` |
| Create new navigation property to activities for sites | `POST /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities` | `await activitiesClient.create(params);` |
| Get activities from sites | `GET /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}` | `await activitiesClient.get({"itemActivity-id": itemActivityId  });` |
| Delete navigation property activities for sites | `DELETE /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}` | `await activitiesClient.delete({"itemActivity-id": itemActivityId  });` |
| Update the navigation property activities in sites | `PATCH /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}` | `await activitiesClient.update(params);` |

## DriveItemClient Endpoints

The DriveItemClient instance gives access to the following `/sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}/driveItem` endpoints. You can get a `DriveItemClient` instance like so:

```typescript
const driveItemClient = await activitiesClient.driveItem(itemActivityId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get driveItem from sites | `GET /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}/driveItem` | `await driveItemClient.list(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}/driveItem/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = driveItemClient.content;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property driveItem from sites | `GET /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}/driveItem/content` | `await contentClient.list(params);` |
| Update content for the navigation property driveItem in sites | `PUT /sites/{site-id}/analytics/itemActivityStats/{itemActivityStat-id}/activities/{itemActivity-id}/driveItem/content` | `await contentClient.set(body, {"":   });` |

## LastSevenDaysClient Endpoints

The LastSevenDaysClient instance gives access to the following `/sites/{site-id}/analytics/lastSevenDays` endpoints. You can get a `LastSevenDaysClient` instance like so:

```typescript
const lastSevenDaysClient = analyticsClient.lastSevenDays;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastSevenDays from sites | `GET /sites/{site-id}/analytics/lastSevenDays` | `await lastSevenDaysClient.list(params);` |

## ColumnsClient Endpoints

The ColumnsClient instance gives access to the following `/sites/{site-id}/columns` endpoints. You can get a `ColumnsClient` instance like so:

```typescript
const columnsClient = await sitesClient.columns(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List columns in a site | `GET /sites/{site-id}/columns` | `await columnsClient.list(params);` |
| Create a columnDefinition in a site | `POST /sites/{site-id}/columns` | `await columnsClient.create(params);` |
| Get columns from sites | `GET /sites/{site-id}/columns/{columnDefinition-id}` | `await columnsClient.get({"columnDefinition-id": columnDefinitionId  });` |
| Delete navigation property columns for sites | `DELETE /sites/{site-id}/columns/{columnDefinition-id}` | `await columnsClient.delete({"columnDefinition-id": columnDefinitionId  });` |
| Update the navigation property columns in sites | `PATCH /sites/{site-id}/columns/{columnDefinition-id}` | `await columnsClient.update(params);` |

## SourceColumnClient Endpoints

The SourceColumnClient instance gives access to the following `/sites/{site-id}/columns/{columnDefinition-id}/sourceColumn` endpoints. You can get a `SourceColumnClient` instance like so:

```typescript
const sourceColumnClient = await columnsClient.sourceColumn(columnDefinitionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sourceColumn from sites | `GET /sites/{site-id}/columns/{columnDefinition-id}/sourceColumn` | `await sourceColumnClient.list(params);` |

## ContentTypesClient Endpoints

The ContentTypesClient instance gives access to the following `/sites/{site-id}/contentTypes` endpoints. You can get a `ContentTypesClient` instance like so:

```typescript
const contentTypesClient = await sitesClient.contentTypes(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List contentTypes in a site | `GET /sites/{site-id}/contentTypes` | `await contentTypesClient.list(params);` |
| Create a content type | `POST /sites/{site-id}/contentTypes` | `await contentTypesClient.create(params);` |
| Get contentType | `GET /sites/{site-id}/contentTypes/{contentType-id}` | `await contentTypesClient.get({"contentType-id": contentTypeId  });` |
| Delete contentType | `DELETE /sites/{site-id}/contentTypes/{contentType-id}` | `await contentTypesClient.delete({"contentType-id": contentTypeId  });` |
| Update contentType | `PATCH /sites/{site-id}/contentTypes/{contentType-id}` | `await contentTypesClient.update(params);` |

## BaseClient Endpoints

The BaseClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/base` endpoints. You can get a `BaseClient` instance like so:

```typescript
const baseClient = await contentTypesClient.base(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get base from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/base` | `await baseClient.list(params);` |

## BaseTypesClient Endpoints

The BaseTypesClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/baseTypes` endpoints. You can get a `BaseTypesClient` instance like so:

```typescript
const baseTypesClient = await contentTypesClient.baseTypes(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get baseTypes from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/baseTypes` | `await baseTypesClient.list(params);` |
| Get baseTypes from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/baseTypes/{contentType-id1}` | `await baseTypesClient.get({"contentType-id1": contentTypeId1  });` |

## ColumnLinksClient Endpoints

The ColumnLinksClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/columnLinks` endpoints. You can get a `ColumnLinksClient` instance like so:

```typescript
const columnLinksClient = await contentTypesClient.columnLinks(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get columnLinks from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/columnLinks` | `await columnLinksClient.list(params);` |
| Create new navigation property to columnLinks for sites | `POST /sites/{site-id}/contentTypes/{contentType-id}/columnLinks` | `await columnLinksClient.create(params);` |
| Get columnLinks from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/columnLinks/{columnLink-id}` | `await columnLinksClient.get({"columnLink-id": columnLinkId  });` |
| Delete navigation property columnLinks for sites | `DELETE /sites/{site-id}/contentTypes/{contentType-id}/columnLinks/{columnLink-id}` | `await columnLinksClient.delete({"columnLink-id": columnLinkId  });` |
| Update the navigation property columnLinks in sites | `PATCH /sites/{site-id}/contentTypes/{contentType-id}/columnLinks/{columnLink-id}` | `await columnLinksClient.update(params);` |

## ColumnPositionsClient Endpoints

The ColumnPositionsClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/columnPositions` endpoints. You can get a `ColumnPositionsClient` instance like so:

```typescript
const columnPositionsClient = await contentTypesClient.columnPositions(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get columnPositions from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/columnPositions` | `await columnPositionsClient.list(params);` |
| Get columnPositions from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/columnPositions/{columnDefinition-id}` | `await columnPositionsClient.get({"columnDefinition-id": columnDefinitionId  });` |

## ColumnsClient Endpoints

The ColumnsClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/columns` endpoints. You can get a `ColumnsClient` instance like so:

```typescript
const columnsClient = await contentTypesClient.columns(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List columnDefinitions in a content type | `GET /sites/{site-id}/contentTypes/{contentType-id}/columns` | `await columnsClient.list(params);` |
| Create a columnDefinition in a content type | `POST /sites/{site-id}/contentTypes/{contentType-id}/columns` | `await columnsClient.create(params);` |
| Get columnDefinition | `GET /sites/{site-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}` | `await columnsClient.get({"columnDefinition-id": columnDefinitionId  });` |
| Delete columnDefinition | `DELETE /sites/{site-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}` | `await columnsClient.delete({"columnDefinition-id": columnDefinitionId  });` |
| Update columnDefinition | `PATCH /sites/{site-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}` | `await columnsClient.update(params);` |

## SourceColumnClient Endpoints

The SourceColumnClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}/sourceColumn` endpoints. You can get a `SourceColumnClient` instance like so:

```typescript
const sourceColumnClient = await columnsClient.sourceColumn(columnDefinitionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sourceColumn from sites | `GET /sites/{site-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}/sourceColumn` | `await sourceColumnClient.list(params);` |

## AssociateWithHubSitesClient Endpoints

The AssociateWithHubSitesClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/associateWithHubSites` endpoints. You can get a `AssociateWithHubSitesClient` instance like so:

```typescript
const associateWithHubSitesClient = await contentTypesClient.associateWithHubSites(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action associateWithHubSites | `POST /sites/{site-id}/contentTypes/{contentType-id}/associateWithHubSites` | `await associateWithHubSitesClient.create(params);` |

## CopyToDefaultContentLocationClient Endpoints

The CopyToDefaultContentLocationClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/copyToDefaultContentLocation` endpoints. You can get a `CopyToDefaultContentLocationClient` instance like so:

```typescript
const copyToDefaultContentLocationClient = await contentTypesClient.copyToDefaultContentLocation(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToDefaultContentLocation | `POST /sites/{site-id}/contentTypes/{contentType-id}/copyToDefaultContentLocation` | `await copyToDefaultContentLocationClient.create(params);` |

## PublishClient Endpoints

The PublishClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/publish` endpoints. You can get a `PublishClient` instance like so:

```typescript
const publishClient = await contentTypesClient.publish(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action publish | `POST /sites/{site-id}/contentTypes/{contentType-id}/publish` | `await publishClient.create(params);` |

## UnpublishClient Endpoints

The UnpublishClient instance gives access to the following `/sites/{site-id}/contentTypes/{contentType-id}/unpublish` endpoints. You can get a `UnpublishClient` instance like so:

```typescript
const unpublishClient = await contentTypesClient.unpublish(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unpublish | `POST /sites/{site-id}/contentTypes/{contentType-id}/unpublish` | `await unpublishClient.create(params);` |

## AddCopyClient Endpoints

The AddCopyClient instance gives access to the following `/sites/{site-id}/contentTypes/addCopy` endpoints. You can get a `AddCopyClient` instance like so:

```typescript
const addCopyClient = contentTypesClient.addCopy;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action addCopy | `POST /sites/{site-id}/contentTypes/addCopy` | `await addCopyClient.create(params);` |

## AddCopyFromContentTypeHubClient Endpoints

The AddCopyFromContentTypeHubClient instance gives access to the following `/sites/{site-id}/contentTypes/addCopyFromContentTypeHub` endpoints. You can get a `AddCopyFromContentTypeHubClient` instance like so:

```typescript
const addCopyFromContentTypeHubClient = contentTypesClient.addCopyFromContentTypeHub;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action addCopyFromContentTypeHub | `POST /sites/{site-id}/contentTypes/addCopyFromContentTypeHub` | `await addCopyFromContentTypeHubClient.create(params);` |

## CreatedByUserClient Endpoints

The CreatedByUserClient instance gives access to the following `/sites/{site-id}/createdByUser` endpoints. You can get a `CreatedByUserClient` instance like so:

```typescript
const createdByUserClient = await sitesClient.createdByUser(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get createdByUser from sites | `GET /sites/{site-id}/createdByUser` | `await createdByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/createdByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = createdByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/createdByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = createdByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/createdByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## DriveClient Endpoints

The DriveClient instance gives access to the following `/sites/{site-id}/drive` endpoints. You can get a `DriveClient` instance like so:

```typescript
const driveClient = await sitesClient.drive(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get drive from sites | `GET /sites/{site-id}/drive` | `await driveClient.list(params);` |

## DrivesClient Endpoints

The DrivesClient instance gives access to the following `/sites/{site-id}/drives` endpoints. You can get a `DrivesClient` instance like so:

```typescript
const drivesClient = await sitesClient.drives(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get drives from sites | `GET /sites/{site-id}/drives` | `await drivesClient.list(params);` |
| Get drives from sites | `GET /sites/{site-id}/drives/{drive-id}` | `await drivesClient.get({"drive-id": driveId  });` |

## ExternalColumnsClient Endpoints

The ExternalColumnsClient instance gives access to the following `/sites/{site-id}/externalColumns` endpoints. You can get a `ExternalColumnsClient` instance like so:

```typescript
const externalColumnsClient = await sitesClient.externalColumns(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get externalColumns from sites | `GET /sites/{site-id}/externalColumns` | `await externalColumnsClient.list(params);` |
| Get externalColumns from sites | `GET /sites/{site-id}/externalColumns/{columnDefinition-id}` | `await externalColumnsClient.get({"columnDefinition-id": columnDefinitionId  });` |

## ItemsClient Endpoints

The ItemsClient instance gives access to the following `/sites/{site-id}/items` endpoints. You can get a `ItemsClient` instance like so:

```typescript
const itemsClient = await sitesClient.items(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get items from sites | `GET /sites/{site-id}/items` | `await itemsClient.list(params);` |
| Get items from sites | `GET /sites/{site-id}/items/{baseItem-id}` | `await itemsClient.get({"baseItem-id": baseItemId  });` |

## LastModifiedByUserClient Endpoints

The LastModifiedByUserClient instance gives access to the following `/sites/{site-id}/lastModifiedByUser` endpoints. You can get a `LastModifiedByUserClient` instance like so:

```typescript
const lastModifiedByUserClient = await sitesClient.lastModifiedByUser(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastModifiedByUser from sites | `GET /sites/{site-id}/lastModifiedByUser` | `await lastModifiedByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/lastModifiedByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = lastModifiedByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/lastModifiedByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = lastModifiedByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/lastModifiedByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## ListsClient Endpoints

The ListsClient instance gives access to the following `/sites/{site-id}/lists` endpoints. You can get a `ListsClient` instance like so:

```typescript
const listsClient = await sitesClient.lists(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lists in a site | `GET /sites/{site-id}/lists` | `await listsClient.list(params);` |
| Create a new list | `POST /sites/{site-id}/lists` | `await listsClient.create(params);` |
| Get metadata for a list | `GET /sites/{site-id}/lists/{list-id}` | `await listsClient.get({"list-id": listId  });` |
| Delete navigation property lists for sites | `DELETE /sites/{site-id}/lists/{list-id}` | `await listsClient.delete({"list-id": listId  });` |
| Update the navigation property lists in sites | `PATCH /sites/{site-id}/lists/{list-id}` | `await listsClient.update(params);` |

## ColumnsClient Endpoints

The ColumnsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/columns` endpoints. You can get a `ColumnsClient` instance like so:

```typescript
const columnsClient = await listsClient.columns(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List columnDefinitions in a list | `GET /sites/{site-id}/lists/{list-id}/columns` | `await columnsClient.list(params);` |
| Create a columnDefinition in a list | `POST /sites/{site-id}/lists/{list-id}/columns` | `await columnsClient.create(params);` |
| Get columns from sites | `GET /sites/{site-id}/lists/{list-id}/columns/{columnDefinition-id}` | `await columnsClient.get({"columnDefinition-id": columnDefinitionId  });` |
| Delete navigation property columns for sites | `DELETE /sites/{site-id}/lists/{list-id}/columns/{columnDefinition-id}` | `await columnsClient.delete({"columnDefinition-id": columnDefinitionId  });` |
| Update the navigation property columns in sites | `PATCH /sites/{site-id}/lists/{list-id}/columns/{columnDefinition-id}` | `await columnsClient.update(params);` |

## SourceColumnClient Endpoints

The SourceColumnClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/columns/{columnDefinition-id}/sourceColumn` endpoints. You can get a `SourceColumnClient` instance like so:

```typescript
const sourceColumnClient = await columnsClient.sourceColumn(columnDefinitionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sourceColumn from sites | `GET /sites/{site-id}/lists/{list-id}/columns/{columnDefinition-id}/sourceColumn` | `await sourceColumnClient.list(params);` |

## ContentTypesClient Endpoints

The ContentTypesClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes` endpoints. You can get a `ContentTypesClient` instance like so:

```typescript
const contentTypesClient = await listsClient.contentTypes(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List contentTypes in a list | `GET /sites/{site-id}/lists/{list-id}/contentTypes` | `await contentTypesClient.list(params);` |
| Create new navigation property to contentTypes for sites | `POST /sites/{site-id}/lists/{list-id}/contentTypes` | `await contentTypesClient.create(params);` |
| Get contentTypes from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}` | `await contentTypesClient.get({"contentType-id": contentTypeId  });` |
| Delete navigation property contentTypes for sites | `DELETE /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}` | `await contentTypesClient.delete({"contentType-id": contentTypeId  });` |
| Update the navigation property contentTypes in sites | `PATCH /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}` | `await contentTypesClient.update(params);` |

## BaseClient Endpoints

The BaseClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/base` endpoints. You can get a `BaseClient` instance like so:

```typescript
const baseClient = await contentTypesClient.base(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get base from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/base` | `await baseClient.list(params);` |

## BaseTypesClient Endpoints

The BaseTypesClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/baseTypes` endpoints. You can get a `BaseTypesClient` instance like so:

```typescript
const baseTypesClient = await contentTypesClient.baseTypes(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get baseTypes from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/baseTypes` | `await baseTypesClient.list(params);` |
| Get baseTypes from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/baseTypes/{contentType-id1}` | `await baseTypesClient.get({"contentType-id1": contentTypeId1  });` |

## ColumnLinksClient Endpoints

The ColumnLinksClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnLinks` endpoints. You can get a `ColumnLinksClient` instance like so:

```typescript
const columnLinksClient = await contentTypesClient.columnLinks(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get columnLinks from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnLinks` | `await columnLinksClient.list(params);` |
| Create new navigation property to columnLinks for sites | `POST /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnLinks` | `await columnLinksClient.create(params);` |
| Get columnLinks from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnLinks/{columnLink-id}` | `await columnLinksClient.get({"columnLink-id": columnLinkId  });` |
| Delete navigation property columnLinks for sites | `DELETE /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnLinks/{columnLink-id}` | `await columnLinksClient.delete({"columnLink-id": columnLinkId  });` |
| Update the navigation property columnLinks in sites | `PATCH /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnLinks/{columnLink-id}` | `await columnLinksClient.update(params);` |

## ColumnPositionsClient Endpoints

The ColumnPositionsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnPositions` endpoints. You can get a `ColumnPositionsClient` instance like so:

```typescript
const columnPositionsClient = await contentTypesClient.columnPositions(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get columnPositions from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnPositions` | `await columnPositionsClient.list(params);` |
| Get columnPositions from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columnPositions/{columnDefinition-id}` | `await columnPositionsClient.get({"columnDefinition-id": columnDefinitionId  });` |

## ColumnsClient Endpoints

The ColumnsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns` endpoints. You can get a `ColumnsClient` instance like so:

```typescript
const columnsClient = await contentTypesClient.columns(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get columns from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns` | `await columnsClient.list(params);` |
| Create new navigation property to columns for sites | `POST /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns` | `await columnsClient.create(params);` |
| Get columns from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}` | `await columnsClient.get({"columnDefinition-id": columnDefinitionId  });` |
| Delete navigation property columns for sites | `DELETE /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}` | `await columnsClient.delete({"columnDefinition-id": columnDefinitionId  });` |
| Update the navigation property columns in sites | `PATCH /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}` | `await columnsClient.update(params);` |

## SourceColumnClient Endpoints

The SourceColumnClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}/sourceColumn` endpoints. You can get a `SourceColumnClient` instance like so:

```typescript
const sourceColumnClient = await columnsClient.sourceColumn(columnDefinitionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sourceColumn from sites | `GET /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/columns/{columnDefinition-id}/sourceColumn` | `await sourceColumnClient.list(params);` |

## AssociateWithHubSitesClient Endpoints

The AssociateWithHubSitesClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/associateWithHubSites` endpoints. You can get a `AssociateWithHubSitesClient` instance like so:

```typescript
const associateWithHubSitesClient = await contentTypesClient.associateWithHubSites(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action associateWithHubSites | `POST /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/associateWithHubSites` | `await associateWithHubSitesClient.create(params);` |

## CopyToDefaultContentLocationClient Endpoints

The CopyToDefaultContentLocationClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/copyToDefaultContentLocation` endpoints. You can get a `CopyToDefaultContentLocationClient` instance like so:

```typescript
const copyToDefaultContentLocationClient = await contentTypesClient.copyToDefaultContentLocation(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToDefaultContentLocation | `POST /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/copyToDefaultContentLocation` | `await copyToDefaultContentLocationClient.create(params);` |

## PublishClient Endpoints

The PublishClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/publish` endpoints. You can get a `PublishClient` instance like so:

```typescript
const publishClient = await contentTypesClient.publish(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action publish | `POST /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/publish` | `await publishClient.create(params);` |

## UnpublishClient Endpoints

The UnpublishClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/unpublish` endpoints. You can get a `UnpublishClient` instance like so:

```typescript
const unpublishClient = await contentTypesClient.unpublish(contentTypeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unpublish | `POST /sites/{site-id}/lists/{list-id}/contentTypes/{contentType-id}/unpublish` | `await unpublishClient.create(params);` |

## AddCopyClient Endpoints

The AddCopyClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/addCopy` endpoints. You can get a `AddCopyClient` instance like so:

```typescript
const addCopyClient = contentTypesClient.addCopy;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action addCopy | `POST /sites/{site-id}/lists/{list-id}/contentTypes/addCopy` | `await addCopyClient.create(params);` |

## AddCopyFromContentTypeHubClient Endpoints

The AddCopyFromContentTypeHubClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/contentTypes/addCopyFromContentTypeHub` endpoints. You can get a `AddCopyFromContentTypeHubClient` instance like so:

```typescript
const addCopyFromContentTypeHubClient = contentTypesClient.addCopyFromContentTypeHub;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action addCopyFromContentTypeHub | `POST /sites/{site-id}/lists/{list-id}/contentTypes/addCopyFromContentTypeHub` | `await addCopyFromContentTypeHubClient.create(params);` |

## CreatedByUserClient Endpoints

The CreatedByUserClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/createdByUser` endpoints. You can get a `CreatedByUserClient` instance like so:

```typescript
const createdByUserClient = await listsClient.createdByUser(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get createdByUser from sites | `GET /sites/{site-id}/lists/{list-id}/createdByUser` | `await createdByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/createdByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = createdByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/lists/{list-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/lists/{list-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/createdByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = createdByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/lists/{list-id}/createdByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## DriveClient Endpoints

The DriveClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/drive` endpoints. You can get a `DriveClient` instance like so:

```typescript
const driveClient = await listsClient.drive(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get drive from sites | `GET /sites/{site-id}/lists/{list-id}/drive` | `await driveClient.list(params);` |

## ItemsClient Endpoints

The ItemsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items` endpoints. You can get a `ItemsClient` instance like so:

```typescript
const itemsClient = await listsClient.items(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Enumerate items in a list | `GET /sites/{site-id}/lists/{list-id}/items` | `await itemsClient.list(params);` |
| Create a new item in a list | `POST /sites/{site-id}/lists/{list-id}/items` | `await itemsClient.create(params);` |
| Get listItem | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}` | `await itemsClient.get({"listItem-id": listItemId  });` |
| Delete an item from a list | `DELETE /sites/{site-id}/lists/{list-id}/items/{listItem-id}` | `await itemsClient.delete({"listItem-id": listItemId  });` |
| Update the navigation property items in sites | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}` | `await itemsClient.update(params);` |

## AnalyticsClient Endpoints

The AnalyticsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/analytics` endpoints. You can get a `AnalyticsClient` instance like so:

```typescript
const analyticsClient = await itemsClient.analytics(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get analytics from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/analytics` | `await analyticsClient.list(params);` |

## CreatedByUserClient Endpoints

The CreatedByUserClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/createdByUser` endpoints. You can get a `CreatedByUserClient` instance like so:

```typescript
const createdByUserClient = await itemsClient.createdByUser(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get createdByUser from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/createdByUser` | `await createdByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/createdByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = createdByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/createdByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = createdByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/createdByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## DocumentSetVersionsClient Endpoints

The DocumentSetVersionsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions` endpoints. You can get a `DocumentSetVersionsClient` instance like so:

```typescript
const documentSetVersionsClient = await itemsClient.documentSetVersions(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List documentSetVersions | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions` | `await documentSetVersionsClient.list(params);` |
| Create documentSetVersion | `POST /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions` | `await documentSetVersionsClient.create(params);` |
| Get documentSetVersion | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}` | `await documentSetVersionsClient.get({"documentSetVersion-id": documentSetVersionId  });` |
| Delete documentSetVersion | `DELETE /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}` | `await documentSetVersionsClient.delete({"documentSetVersion-id": documentSetVersionId  });` |
| Update the navigation property documentSetVersions in sites | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}` | `await documentSetVersionsClient.update(params);` |

## FieldsClient Endpoints

The FieldsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}/fields` endpoints. You can get a `FieldsClient` instance like so:

```typescript
const fieldsClient = await documentSetVersionsClient.fields(documentSetVersionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fields from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}/fields` | `await fieldsClient.list(params);` |
| Delete navigation property fields for sites | `DELETE /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}/fields` | `await fieldsClient.delete({"documentSetVersion-id": documentSetVersionId  });` |
| Update the navigation property fields in sites | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}/fields` | `await fieldsClient.update(params);` |

## RestoreClient Endpoints

The RestoreClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}/restore` endpoints. You can get a `RestoreClient` instance like so:

```typescript
const restoreClient = await documentSetVersionsClient.restore(documentSetVersionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action restore | `POST /sites/{site-id}/lists/{list-id}/items/{listItem-id}/documentSetVersions/{documentSetVersion-id}/restore` | `await restoreClient.create(params);` |

## DriveItemClient Endpoints

The DriveItemClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/driveItem` endpoints. You can get a `DriveItemClient` instance like so:

```typescript
const driveItemClient = await itemsClient.driveItem(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get driveItem from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/driveItem` | `await driveItemClient.list(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/driveItem/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = driveItemClient.content;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property driveItem from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/driveItem/content` | `await contentClient.list(params);` |
| Update content for the navigation property driveItem in sites | `PUT /sites/{site-id}/lists/{list-id}/items/{listItem-id}/driveItem/content` | `await contentClient.set(body, {"":   });` |

## FieldsClient Endpoints

The FieldsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/fields` endpoints. You can get a `FieldsClient` instance like so:

```typescript
const fieldsClient = await itemsClient.fields(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fields from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/fields` | `await fieldsClient.list(params);` |
| Delete navigation property fields for sites | `DELETE /sites/{site-id}/lists/{list-id}/items/{listItem-id}/fields` | `await fieldsClient.delete({"listItem-id": listItemId  });` |
| Update listItem | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}/fields` | `await fieldsClient.update(params);` |

## LastModifiedByUserClient Endpoints

The LastModifiedByUserClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/lastModifiedByUser` endpoints. You can get a `LastModifiedByUserClient` instance like so:

```typescript
const lastModifiedByUserClient = await itemsClient.lastModifiedByUser(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastModifiedByUser from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/lastModifiedByUser` | `await lastModifiedByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/lastModifiedByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = lastModifiedByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/lastModifiedByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = lastModifiedByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/lastModifiedByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## CreateLinkClient Endpoints

The CreateLinkClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/createLink` endpoints. You can get a `CreateLinkClient` instance like so:

```typescript
const createLinkClient = await itemsClient.createLink(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action createLink | `POST /sites/{site-id}/lists/{list-id}/items/{listItem-id}/createLink` | `await createLinkClient.create(params);` |

## VersionsClient Endpoints

The VersionsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions` endpoints. You can get a `VersionsClient` instance like so:

```typescript
const versionsClient = await itemsClient.versions(listItemId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Listing versions of a ListItem | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions` | `await versionsClient.list(params);` |
| Create new navigation property to versions for sites | `POST /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions` | `await versionsClient.create(params);` |
| Get a ListItemVersion resource | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}` | `await versionsClient.get({"listItemVersion-id": listItemVersionId  });` |
| Delete navigation property versions for sites | `DELETE /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}` | `await versionsClient.delete({"listItemVersion-id": listItemVersionId  });` |
| Update the navigation property versions in sites | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}` | `await versionsClient.update(params);` |

## FieldsClient Endpoints

The FieldsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}/fields` endpoints. You can get a `FieldsClient` instance like so:

```typescript
const fieldsClient = await versionsClient.fields(listItemVersionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fields from sites | `GET /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}/fields` | `await fieldsClient.list(params);` |
| Delete navigation property fields for sites | `DELETE /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}/fields` | `await fieldsClient.delete({"listItemVersion-id": listItemVersionId  });` |
| Update the navigation property fields in sites | `PATCH /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}/fields` | `await fieldsClient.update(params);` |

## RestoreVersionClient Endpoints

The RestoreVersionClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}/restoreVersion` endpoints. You can get a `RestoreVersionClient` instance like so:

```typescript
const restoreVersionClient = await versionsClient.restoreVersion(listItemVersionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action restoreVersion | `POST /sites/{site-id}/lists/{list-id}/items/{listItem-id}/versions/{listItemVersion-id}/restoreVersion` | `await restoreVersionClient.create(params);` |

## LastModifiedByUserClient Endpoints

The LastModifiedByUserClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/lastModifiedByUser` endpoints. You can get a `LastModifiedByUserClient` instance like so:

```typescript
const lastModifiedByUserClient = await listsClient.lastModifiedByUser(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastModifiedByUser from sites | `GET /sites/{site-id}/lists/{list-id}/lastModifiedByUser` | `await lastModifiedByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/lastModifiedByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = lastModifiedByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/lists/{list-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/lists/{list-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/lastModifiedByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = lastModifiedByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/lists/{list-id}/lastModifiedByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## OperationsClient Endpoints

The OperationsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/operations` endpoints. You can get a `OperationsClient` instance like so:

```typescript
const operationsClient = await listsClient.operations(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get operations from sites | `GET /sites/{site-id}/lists/{list-id}/operations` | `await operationsClient.list(params);` |
| Create new navigation property to operations for sites | `POST /sites/{site-id}/lists/{list-id}/operations` | `await operationsClient.create(params);` |
| Get operations from sites | `GET /sites/{site-id}/lists/{list-id}/operations/{richLongRunningOperation-id}` | `await operationsClient.get({"richLongRunningOperation-id": richLongRunningOperationId  });` |
| Delete navigation property operations for sites | `DELETE /sites/{site-id}/lists/{list-id}/operations/{richLongRunningOperation-id}` | `await operationsClient.delete({"richLongRunningOperation-id": richLongRunningOperationId  });` |
| Update the navigation property operations in sites | `PATCH /sites/{site-id}/lists/{list-id}/operations/{richLongRunningOperation-id}` | `await operationsClient.update(params);` |

## SubscriptionsClient Endpoints

The SubscriptionsClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/subscriptions` endpoints. You can get a `SubscriptionsClient` instance like so:

```typescript
const subscriptionsClient = await listsClient.subscriptions(listId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get subscriptions from sites | `GET /sites/{site-id}/lists/{list-id}/subscriptions` | `await subscriptionsClient.list(params);` |
| Create new navigation property to subscriptions for sites | `POST /sites/{site-id}/lists/{list-id}/subscriptions` | `await subscriptionsClient.create(params);` |
| Get subscriptions from sites | `GET /sites/{site-id}/lists/{list-id}/subscriptions/{subscription-id}` | `await subscriptionsClient.get({"subscription-id": subscriptionId  });` |
| Delete navigation property subscriptions for sites | `DELETE /sites/{site-id}/lists/{list-id}/subscriptions/{subscription-id}` | `await subscriptionsClient.delete({"subscription-id": subscriptionId  });` |
| Update the navigation property subscriptions in sites | `PATCH /sites/{site-id}/lists/{list-id}/subscriptions/{subscription-id}` | `await subscriptionsClient.update(params);` |

## ReauthorizeClient Endpoints

The ReauthorizeClient instance gives access to the following `/sites/{site-id}/lists/{list-id}/subscriptions/{subscription-id}/reauthorize` endpoints. You can get a `ReauthorizeClient` instance like so:

```typescript
const reauthorizeClient = await subscriptionsClient.reauthorize(subscriptionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action reauthorize | `POST /sites/{site-id}/lists/{list-id}/subscriptions/{subscription-id}/reauthorize` | `await reauthorizeClient.create(params);` |

## OnenoteClient Endpoints

The OnenoteClient instance gives access to the following `/sites/{site-id}/onenote` endpoints. You can get a `OnenoteClient` instance like so:

```typescript
const onenoteClient = await sitesClient.onenote(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get onenote from sites | `GET /sites/{site-id}/onenote` | `await onenoteClient.list(params);` |
| Delete navigation property onenote for sites | `DELETE /sites/{site-id}/onenote` | `await onenoteClient.delete({"site-id": siteId  });` |
| Update the navigation property onenote in sites | `PATCH /sites/{site-id}/onenote` | `await onenoteClient.update(params);` |

## NotebooksClient Endpoints

The NotebooksClient instance gives access to the following `/sites/{site-id}/onenote/notebooks` endpoints. You can get a `NotebooksClient` instance like so:

```typescript
const notebooksClient = onenoteClient.notebooks;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get notebooks from sites | `GET /sites/{site-id}/onenote/notebooks` | `await notebooksClient.list(params);` |
| Create new navigation property to notebooks for sites | `POST /sites/{site-id}/onenote/notebooks` | `await notebooksClient.create(params);` |
| Get notebooks from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}` | `await notebooksClient.get({"notebook-id": notebookId  });` |
| Delete navigation property notebooks for sites | `DELETE /sites/{site-id}/onenote/notebooks/{notebook-id}` | `await notebooksClient.delete({"notebook-id": notebookId  });` |
| Update the navigation property notebooks in sites | `PATCH /sites/{site-id}/onenote/notebooks/{notebook-id}` | `await notebooksClient.update(params);` |

## CopyNotebookClient Endpoints

The CopyNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/copyNotebook` endpoints. You can get a `CopyNotebookClient` instance like so:

```typescript
const copyNotebookClient = await notebooksClient.copyNotebook(notebookId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyNotebook | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/copyNotebook` | `await copyNotebookClient.create(params);` |

## SectionGroupsClient Endpoints

The SectionGroupsClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups` endpoints. You can get a `SectionGroupsClient` instance like so:

```typescript
const sectionGroupsClient = await notebooksClient.sectionGroups(notebookId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups` | `await sectionGroupsClient.list(params);` |
| Create new navigation property to sectionGroups for sites | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups` | `await sectionGroupsClient.create(params);` |
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}` | `await sectionGroupsClient.get({"sectionGroup-id": sectionGroupId  });` |
| Delete navigation property sectionGroups for sites | `DELETE /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}` | `await sectionGroupsClient.delete({"sectionGroup-id": sectionGroupId  });` |
| Update the navigation property sectionGroups in sites | `PATCH /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}` | `await sectionGroupsClient.update(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await sectionGroupsClient.parentNotebook(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionGroupClient Endpoints

The ParentSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/parentSectionGroup` endpoints. You can get a `ParentSectionGroupClient` instance like so:

```typescript
const parentSectionGroupClient = await sectionGroupsClient.parentSectionGroup(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSectionGroup from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/parentSectionGroup` | `await parentSectionGroupClient.list(params);` |

## SectionGroupsClient Endpoints

The SectionGroupsClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sectionGroups` endpoints. You can get a `SectionGroupsClient` instance like so:

```typescript
const sectionGroupsClient = await sectionGroupsClient.sectionGroups(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sectionGroups` | `await sectionGroupsClient.list(params);` |
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sectionGroups/{sectionGroup-id1}` | `await sectionGroupsClient.get({"sectionGroup-id1": sectionGroupId1  });` |

## SectionsClient Endpoints

The SectionsClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections` endpoints. You can get a `SectionsClient` instance like so:

```typescript
const sectionsClient = await sectionGroupsClient.sections(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sections from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections` | `await sectionsClient.list(params);` |
| Create new navigation property to sections for sites | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections` | `await sectionsClient.create(params);` |
| Get sections from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}` | `await sectionsClient.get({"onenoteSection-id": onenoteSectionId  });` |
| Delete navigation property sections for sites | `DELETE /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}` | `await sectionsClient.delete({"onenoteSection-id": onenoteSectionId  });` |
| Update the navigation property sections in sites | `PATCH /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}` | `await sectionsClient.update(params);` |

## CopyToNotebookClient Endpoints

The CopyToNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToNotebook` endpoints. You can get a `CopyToNotebookClient` instance like so:

```typescript
const copyToNotebookClient = await sectionsClient.copyToNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToNotebook | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToNotebook` | `await copyToNotebookClient.create(params);` |

## CopyToSectionGroupClient Endpoints

The CopyToSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToSectionGroup` endpoints. You can get a `CopyToSectionGroupClient` instance like so:

```typescript
const copyToSectionGroupClient = await sectionsClient.copyToSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSectionGroup | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToSectionGroup` | `await copyToSectionGroupClient.create(params);` |

## PagesClient Endpoints

The PagesClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages` endpoints. You can get a `PagesClient` instance like so:

```typescript
const pagesClient = await sectionsClient.pages(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get pages from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages` | `await pagesClient.list(params);` |
| Create new navigation property to pages for sites | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages` | `await pagesClient.create(params);` |
| Get pages from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.get({"onenotePage-id": onenotePageId  });` |
| Delete navigation property pages for sites | `DELETE /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.delete({"onenotePage-id": onenotePageId  });` |
| Update the navigation property pages in sites | `PATCH /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await pagesClient.content(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property pages from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property pages in sites | `PUT /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.set(body, {"onenotePage-id": onenotePageId  });` |

## CopyToSectionClient Endpoints

The CopyToSectionClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` endpoints. You can get a `CopyToSectionClient` instance like so:

```typescript
const copyToSectionClient = await pagesClient.copyToSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSection | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` | `await copyToSectionClient.create(params);` |

## OnenotePatchContentClient Endpoints

The OnenotePatchContentClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` endpoints. You can get a `OnenotePatchContentClient` instance like so:

```typescript
const onenotePatchContentClient = await pagesClient.onenotePatchContent(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action onenotePatchContent | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` | `await onenotePatchContentClient.create(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await pagesClient.parentNotebook(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionClient Endpoints

The ParentSectionClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` endpoints. You can get a `ParentSectionClient` instance like so:

```typescript
const parentSectionClient = await pagesClient.parentSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSection from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` | `await parentSectionClient.list(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await sectionsClient.parentNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionGroupClient Endpoints

The ParentSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentSectionGroup` endpoints. You can get a `ParentSectionGroupClient` instance like so:

```typescript
const parentSectionGroupClient = await sectionsClient.parentSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSectionGroup from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentSectionGroup` | `await parentSectionGroupClient.list(params);` |

## SectionsClient Endpoints

The SectionsClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections` endpoints. You can get a `SectionsClient` instance like so:

```typescript
const sectionsClient = await notebooksClient.sections(notebookId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sections from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections` | `await sectionsClient.list(params);` |
| Create new navigation property to sections for sites | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sections` | `await sectionsClient.create(params);` |
| Get sections from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}` | `await sectionsClient.get({"onenoteSection-id": onenoteSectionId  });` |
| Delete navigation property sections for sites | `DELETE /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}` | `await sectionsClient.delete({"onenoteSection-id": onenoteSectionId  });` |
| Update the navigation property sections in sites | `PATCH /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}` | `await sectionsClient.update(params);` |

## CopyToNotebookClient Endpoints

The CopyToNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/copyToNotebook` endpoints. You can get a `CopyToNotebookClient` instance like so:

```typescript
const copyToNotebookClient = await sectionsClient.copyToNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToNotebook | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/copyToNotebook` | `await copyToNotebookClient.create(params);` |

## CopyToSectionGroupClient Endpoints

The CopyToSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/copyToSectionGroup` endpoints. You can get a `CopyToSectionGroupClient` instance like so:

```typescript
const copyToSectionGroupClient = await sectionsClient.copyToSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSectionGroup | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/copyToSectionGroup` | `await copyToSectionGroupClient.create(params);` |

## PagesClient Endpoints

The PagesClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages` endpoints. You can get a `PagesClient` instance like so:

```typescript
const pagesClient = await sectionsClient.pages(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get pages from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages` | `await pagesClient.list(params);` |
| Create new navigation property to pages for sites | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages` | `await pagesClient.create(params);` |
| Get pages from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.get({"onenotePage-id": onenotePageId  });` |
| Delete navigation property pages for sites | `DELETE /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.delete({"onenotePage-id": onenotePageId  });` |
| Update the navigation property pages in sites | `PATCH /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await pagesClient.content(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property pages from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property pages in sites | `PUT /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.set(body, {"onenotePage-id": onenotePageId  });` |

## CopyToSectionClient Endpoints

The CopyToSectionClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` endpoints. You can get a `CopyToSectionClient` instance like so:

```typescript
const copyToSectionClient = await pagesClient.copyToSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSection | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` | `await copyToSectionClient.create(params);` |

## OnenotePatchContentClient Endpoints

The OnenotePatchContentClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` endpoints. You can get a `OnenotePatchContentClient` instance like so:

```typescript
const onenotePatchContentClient = await pagesClient.onenotePatchContent(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action onenotePatchContent | `POST /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` | `await onenotePatchContentClient.create(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await pagesClient.parentNotebook(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionClient Endpoints

The ParentSectionClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` endpoints. You can get a `ParentSectionClient` instance like so:

```typescript
const parentSectionClient = await pagesClient.parentSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSection from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` | `await parentSectionClient.list(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await sectionsClient.parentNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionGroupClient Endpoints

The ParentSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/parentSectionGroup` endpoints. You can get a `ParentSectionGroupClient` instance like so:

```typescript
const parentSectionGroupClient = await sectionsClient.parentSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSectionGroup from sites | `GET /sites/{site-id}/onenote/notebooks/{notebook-id}/sections/{onenoteSection-id}/parentSectionGroup` | `await parentSectionGroupClient.list(params);` |

## GetNotebookFromWebUrlClient Endpoints

The GetNotebookFromWebUrlClient instance gives access to the following `/sites/{site-id}/onenote/notebooks/getNotebookFromWebUrl` endpoints. You can get a `GetNotebookFromWebUrlClient` instance like so:

```typescript
const getNotebookFromWebUrlClient = notebooksClient.getNotebookFromWebUrl;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getNotebookFromWebUrl | `POST /sites/{site-id}/onenote/notebooks/getNotebookFromWebUrl` | `await getNotebookFromWebUrlClient.create(params);` |

## OperationsClient Endpoints

The OperationsClient instance gives access to the following `/sites/{site-id}/onenote/operations` endpoints. You can get a `OperationsClient` instance like so:

```typescript
const operationsClient = onenoteClient.operations;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get operations from sites | `GET /sites/{site-id}/onenote/operations` | `await operationsClient.list(params);` |
| Create new navigation property to operations for sites | `POST /sites/{site-id}/onenote/operations` | `await operationsClient.create(params);` |
| Get operations from sites | `GET /sites/{site-id}/onenote/operations/{onenoteOperation-id}` | `await operationsClient.get({"onenoteOperation-id": onenoteOperationId  });` |
| Delete navigation property operations for sites | `DELETE /sites/{site-id}/onenote/operations/{onenoteOperation-id}` | `await operationsClient.delete({"onenoteOperation-id": onenoteOperationId  });` |
| Update the navigation property operations in sites | `PATCH /sites/{site-id}/onenote/operations/{onenoteOperation-id}` | `await operationsClient.update(params);` |

## PagesClient Endpoints

The PagesClient instance gives access to the following `/sites/{site-id}/onenote/pages` endpoints. You can get a `PagesClient` instance like so:

```typescript
const pagesClient = onenoteClient.pages;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get pages from sites | `GET /sites/{site-id}/onenote/pages` | `await pagesClient.list(params);` |
| Create new navigation property to pages for sites | `POST /sites/{site-id}/onenote/pages` | `await pagesClient.create(params);` |
| Get pages from sites | `GET /sites/{site-id}/onenote/pages/{onenotePage-id}` | `await pagesClient.get({"onenotePage-id": onenotePageId  });` |
| Delete navigation property pages for sites | `DELETE /sites/{site-id}/onenote/pages/{onenotePage-id}` | `await pagesClient.delete({"onenotePage-id": onenotePageId  });` |
| Update the navigation property pages in sites | `PATCH /sites/{site-id}/onenote/pages/{onenotePage-id}` | `await pagesClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/onenote/pages/{onenotePage-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await pagesClient.content(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property pages from sites | `GET /sites/{site-id}/onenote/pages/{onenotePage-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property pages in sites | `PUT /sites/{site-id}/onenote/pages/{onenotePage-id}/content` | `await contentClient.set(body, {"onenotePage-id": onenotePageId  });` |

## CopyToSectionClient Endpoints

The CopyToSectionClient instance gives access to the following `/sites/{site-id}/onenote/pages/{onenotePage-id}/copyToSection` endpoints. You can get a `CopyToSectionClient` instance like so:

```typescript
const copyToSectionClient = await pagesClient.copyToSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSection | `POST /sites/{site-id}/onenote/pages/{onenotePage-id}/copyToSection` | `await copyToSectionClient.create(params);` |

## OnenotePatchContentClient Endpoints

The OnenotePatchContentClient instance gives access to the following `/sites/{site-id}/onenote/pages/{onenotePage-id}/onenotePatchContent` endpoints. You can get a `OnenotePatchContentClient` instance like so:

```typescript
const onenotePatchContentClient = await pagesClient.onenotePatchContent(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action onenotePatchContent | `POST /sites/{site-id}/onenote/pages/{onenotePage-id}/onenotePatchContent` | `await onenotePatchContentClient.create(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/pages/{onenotePage-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await pagesClient.parentNotebook(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/pages/{onenotePage-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionClient Endpoints

The ParentSectionClient instance gives access to the following `/sites/{site-id}/onenote/pages/{onenotePage-id}/parentSection` endpoints. You can get a `ParentSectionClient` instance like so:

```typescript
const parentSectionClient = await pagesClient.parentSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSection from sites | `GET /sites/{site-id}/onenote/pages/{onenotePage-id}/parentSection` | `await parentSectionClient.list(params);` |

## ResourcesClient Endpoints

The ResourcesClient instance gives access to the following `/sites/{site-id}/onenote/resources` endpoints. You can get a `ResourcesClient` instance like so:

```typescript
const resourcesClient = onenoteClient.resources;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get resources from sites | `GET /sites/{site-id}/onenote/resources` | `await resourcesClient.list(params);` |
| Create new navigation property to resources for sites | `POST /sites/{site-id}/onenote/resources` | `await resourcesClient.create(params);` |
| Get resources from sites | `GET /sites/{site-id}/onenote/resources/{onenoteResource-id}` | `await resourcesClient.get({"onenoteResource-id": onenoteResourceId  });` |
| Delete navigation property resources for sites | `DELETE /sites/{site-id}/onenote/resources/{onenoteResource-id}` | `await resourcesClient.delete({"onenoteResource-id": onenoteResourceId  });` |
| Update the navigation property resources in sites | `PATCH /sites/{site-id}/onenote/resources/{onenoteResource-id}` | `await resourcesClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/onenote/resources/{onenoteResource-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await resourcesClient.content(onenoteResourceId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property resources from sites | `GET /sites/{site-id}/onenote/resources/{onenoteResource-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property resources in sites | `PUT /sites/{site-id}/onenote/resources/{onenoteResource-id}/content` | `await contentClient.set(body, {"onenoteResource-id": onenoteResourceId  });` |

## SectionGroupsClient Endpoints

The SectionGroupsClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups` endpoints. You can get a `SectionGroupsClient` instance like so:

```typescript
const sectionGroupsClient = onenoteClient.sectionGroups;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/sectionGroups` | `await sectionGroupsClient.list(params);` |
| Create new navigation property to sectionGroups for sites | `POST /sites/{site-id}/onenote/sectionGroups` | `await sectionGroupsClient.create(params);` |
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}` | `await sectionGroupsClient.get({"sectionGroup-id": sectionGroupId  });` |
| Delete navigation property sectionGroups for sites | `DELETE /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}` | `await sectionGroupsClient.delete({"sectionGroup-id": sectionGroupId  });` |
| Update the navigation property sectionGroups in sites | `PATCH /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}` | `await sectionGroupsClient.update(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await sectionGroupsClient.parentNotebook(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionGroupClient Endpoints

The ParentSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/parentSectionGroup` endpoints. You can get a `ParentSectionGroupClient` instance like so:

```typescript
const parentSectionGroupClient = await sectionGroupsClient.parentSectionGroup(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSectionGroup from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/parentSectionGroup` | `await parentSectionGroupClient.list(params);` |

## SectionGroupsClient Endpoints

The SectionGroupsClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sectionGroups` endpoints. You can get a `SectionGroupsClient` instance like so:

```typescript
const sectionGroupsClient = await sectionGroupsClient.sectionGroups(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sectionGroups` | `await sectionGroupsClient.list(params);` |
| Get sectionGroups from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sectionGroups/{sectionGroup-id1}` | `await sectionGroupsClient.get({"sectionGroup-id1": sectionGroupId1  });` |

## SectionsClient Endpoints

The SectionsClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections` endpoints. You can get a `SectionsClient` instance like so:

```typescript
const sectionsClient = await sectionGroupsClient.sections(sectionGroupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sections from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections` | `await sectionsClient.list(params);` |
| Create new navigation property to sections for sites | `POST /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections` | `await sectionsClient.create(params);` |
| Get sections from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}` | `await sectionsClient.get({"onenoteSection-id": onenoteSectionId  });` |
| Delete navigation property sections for sites | `DELETE /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}` | `await sectionsClient.delete({"onenoteSection-id": onenoteSectionId  });` |
| Update the navigation property sections in sites | `PATCH /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}` | `await sectionsClient.update(params);` |

## CopyToNotebookClient Endpoints

The CopyToNotebookClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToNotebook` endpoints. You can get a `CopyToNotebookClient` instance like so:

```typescript
const copyToNotebookClient = await sectionsClient.copyToNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToNotebook | `POST /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToNotebook` | `await copyToNotebookClient.create(params);` |

## CopyToSectionGroupClient Endpoints

The CopyToSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToSectionGroup` endpoints. You can get a `CopyToSectionGroupClient` instance like so:

```typescript
const copyToSectionGroupClient = await sectionsClient.copyToSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSectionGroup | `POST /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/copyToSectionGroup` | `await copyToSectionGroupClient.create(params);` |

## PagesClient Endpoints

The PagesClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages` endpoints. You can get a `PagesClient` instance like so:

```typescript
const pagesClient = await sectionsClient.pages(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get pages from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages` | `await pagesClient.list(params);` |
| Create new navigation property to pages for sites | `POST /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages` | `await pagesClient.create(params);` |
| Get pages from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.get({"onenotePage-id": onenotePageId  });` |
| Delete navigation property pages for sites | `DELETE /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.delete({"onenotePage-id": onenotePageId  });` |
| Update the navigation property pages in sites | `PATCH /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await pagesClient.content(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property pages from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property pages in sites | `PUT /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.set(body, {"onenotePage-id": onenotePageId  });` |

## CopyToSectionClient Endpoints

The CopyToSectionClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` endpoints. You can get a `CopyToSectionClient` instance like so:

```typescript
const copyToSectionClient = await pagesClient.copyToSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSection | `POST /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` | `await copyToSectionClient.create(params);` |

## OnenotePatchContentClient Endpoints

The OnenotePatchContentClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` endpoints. You can get a `OnenotePatchContentClient` instance like so:

```typescript
const onenotePatchContentClient = await pagesClient.onenotePatchContent(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action onenotePatchContent | `POST /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` | `await onenotePatchContentClient.create(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await pagesClient.parentNotebook(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionClient Endpoints

The ParentSectionClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` endpoints. You can get a `ParentSectionClient` instance like so:

```typescript
const parentSectionClient = await pagesClient.parentSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSection from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` | `await parentSectionClient.list(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await sectionsClient.parentNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionGroupClient Endpoints

The ParentSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentSectionGroup` endpoints. You can get a `ParentSectionGroupClient` instance like so:

```typescript
const parentSectionGroupClient = await sectionsClient.parentSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSectionGroup from sites | `GET /sites/{site-id}/onenote/sectionGroups/{sectionGroup-id}/sections/{onenoteSection-id}/parentSectionGroup` | `await parentSectionGroupClient.list(params);` |

## SectionsClient Endpoints

The SectionsClient instance gives access to the following `/sites/{site-id}/onenote/sections` endpoints. You can get a `SectionsClient` instance like so:

```typescript
const sectionsClient = onenoteClient.sections;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sections from sites | `GET /sites/{site-id}/onenote/sections` | `await sectionsClient.list(params);` |
| Create new navigation property to sections for sites | `POST /sites/{site-id}/onenote/sections` | `await sectionsClient.create(params);` |
| Get sections from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}` | `await sectionsClient.get({"onenoteSection-id": onenoteSectionId  });` |
| Delete navigation property sections for sites | `DELETE /sites/{site-id}/onenote/sections/{onenoteSection-id}` | `await sectionsClient.delete({"onenoteSection-id": onenoteSectionId  });` |
| Update the navigation property sections in sites | `PATCH /sites/{site-id}/onenote/sections/{onenoteSection-id}` | `await sectionsClient.update(params);` |

## CopyToNotebookClient Endpoints

The CopyToNotebookClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/copyToNotebook` endpoints. You can get a `CopyToNotebookClient` instance like so:

```typescript
const copyToNotebookClient = await sectionsClient.copyToNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToNotebook | `POST /sites/{site-id}/onenote/sections/{onenoteSection-id}/copyToNotebook` | `await copyToNotebookClient.create(params);` |

## CopyToSectionGroupClient Endpoints

The CopyToSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/copyToSectionGroup` endpoints. You can get a `CopyToSectionGroupClient` instance like so:

```typescript
const copyToSectionGroupClient = await sectionsClient.copyToSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSectionGroup | `POST /sites/{site-id}/onenote/sections/{onenoteSection-id}/copyToSectionGroup` | `await copyToSectionGroupClient.create(params);` |

## PagesClient Endpoints

The PagesClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/pages` endpoints. You can get a `PagesClient` instance like so:

```typescript
const pagesClient = await sectionsClient.pages(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get pages from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages` | `await pagesClient.list(params);` |
| Create new navigation property to pages for sites | `POST /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages` | `await pagesClient.create(params);` |
| Get pages from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.get({"onenotePage-id": onenotePageId  });` |
| Delete navigation property pages for sites | `DELETE /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.delete({"onenotePage-id": onenotePageId  });` |
| Update the navigation property pages in sites | `PATCH /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}` | `await pagesClient.update(params);` |

## ContentClient Endpoints

The ContentClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` endpoints. You can get a `ContentClient` instance like so:

```typescript
const contentClient = await pagesClient.content(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get content for the navigation property pages from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.list(params);` |
| Update content for the navigation property pages in sites | `PUT /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/content` | `await contentClient.set(body, {"onenotePage-id": onenotePageId  });` |

## CopyToSectionClient Endpoints

The CopyToSectionClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` endpoints. You can get a `CopyToSectionClient` instance like so:

```typescript
const copyToSectionClient = await pagesClient.copyToSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action copyToSection | `POST /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/copyToSection` | `await copyToSectionClient.create(params);` |

## OnenotePatchContentClient Endpoints

The OnenotePatchContentClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` endpoints. You can get a `OnenotePatchContentClient` instance like so:

```typescript
const onenotePatchContentClient = await pagesClient.onenotePatchContent(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action onenotePatchContent | `POST /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/onenotePatchContent` | `await onenotePatchContentClient.create(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await pagesClient.parentNotebook(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionClient Endpoints

The ParentSectionClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` endpoints. You can get a `ParentSectionClient` instance like so:

```typescript
const parentSectionClient = await pagesClient.parentSection(onenotePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSection from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}/pages/{onenotePage-id}/parentSection` | `await parentSectionClient.list(params);` |

## ParentNotebookClient Endpoints

The ParentNotebookClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/parentNotebook` endpoints. You can get a `ParentNotebookClient` instance like so:

```typescript
const parentNotebookClient = await sectionsClient.parentNotebook(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentNotebook from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}/parentNotebook` | `await parentNotebookClient.list(params);` |

## ParentSectionGroupClient Endpoints

The ParentSectionGroupClient instance gives access to the following `/sites/{site-id}/onenote/sections/{onenoteSection-id}/parentSectionGroup` endpoints. You can get a `ParentSectionGroupClient` instance like so:

```typescript
const parentSectionGroupClient = await sectionsClient.parentSectionGroup(onenoteSectionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentSectionGroup from sites | `GET /sites/{site-id}/onenote/sections/{onenoteSection-id}/parentSectionGroup` | `await parentSectionGroupClient.list(params);` |

## OperationsClient Endpoints

The OperationsClient instance gives access to the following `/sites/{site-id}/operations` endpoints. You can get a `OperationsClient` instance like so:

```typescript
const operationsClient = await sitesClient.operations(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List operations on a site | `GET /sites/{site-id}/operations` | `await operationsClient.list(params);` |
| Create new navigation property to operations for sites | `POST /sites/{site-id}/operations` | `await operationsClient.create(params);` |
| Get richLongRunningOperation | `GET /sites/{site-id}/operations/{richLongRunningOperation-id}` | `await operationsClient.get({"richLongRunningOperation-id": richLongRunningOperationId  });` |
| Delete navigation property operations for sites | `DELETE /sites/{site-id}/operations/{richLongRunningOperation-id}` | `await operationsClient.delete({"richLongRunningOperation-id": richLongRunningOperationId  });` |
| Update the navigation property operations in sites | `PATCH /sites/{site-id}/operations/{richLongRunningOperation-id}` | `await operationsClient.update(params);` |

## PagesClient Endpoints

The PagesClient instance gives access to the following `/sites/{site-id}/pages` endpoints. You can get a `PagesClient` instance like so:

```typescript
const pagesClient = await sitesClient.pages(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List baseSitePages | `GET /sites/{site-id}/pages` | `await pagesClient.list(params);` |
| Create a page in the site pages list of a site | `POST /sites/{site-id}/pages` | `await pagesClient.create(params);` |
| Get baseSitePage | `GET /sites/{site-id}/pages/{baseSitePage-id}` | `await pagesClient.get({"baseSitePage-id": baseSitePageId  });` |
| Delete baseSitePage | `DELETE /sites/{site-id}/pages/{baseSitePage-id}` | `await pagesClient.delete({"baseSitePage-id": baseSitePageId  });` |
| Update the navigation property pages in sites | `PATCH /sites/{site-id}/pages/{baseSitePage-id}` | `await pagesClient.update(params);` |

## CreatedByUserClient Endpoints

The CreatedByUserClient instance gives access to the following `/sites/{site-id}/pages/{baseSitePage-id}/createdByUser` endpoints. You can get a `CreatedByUserClient` instance like so:

```typescript
const createdByUserClient = await pagesClient.createdByUser(baseSitePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get createdByUser from sites | `GET /sites/{site-id}/pages/{baseSitePage-id}/createdByUser` | `await createdByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/pages/{baseSitePage-id}/createdByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = createdByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/pages/{baseSitePage-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/pages/{baseSitePage-id}/createdByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/pages/{baseSitePage-id}/createdByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = createdByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/pages/{baseSitePage-id}/createdByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## LastModifiedByUserClient Endpoints

The LastModifiedByUserClient instance gives access to the following `/sites/{site-id}/pages/{baseSitePage-id}/lastModifiedByUser` endpoints. You can get a `LastModifiedByUserClient` instance like so:

```typescript
const lastModifiedByUserClient = await pagesClient.lastModifiedByUser(baseSitePageId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get lastModifiedByUser from sites | `GET /sites/{site-id}/pages/{baseSitePage-id}/lastModifiedByUser` | `await lastModifiedByUserClient.list(params);` |

## MailboxSettingsClient Endpoints

The MailboxSettingsClient instance gives access to the following `/sites/{site-id}/pages/{baseSitePage-id}/lastModifiedByUser/mailboxSettings` endpoints. You can get a `MailboxSettingsClient` instance like so:

```typescript
const mailboxSettingsClient = lastModifiedByUserClient.mailboxSettings;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxSettings property value | `GET /sites/{site-id}/pages/{baseSitePage-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.list(params);` |
| Update property mailboxSettings value. | `PATCH /sites/{site-id}/pages/{baseSitePage-id}/lastModifiedByUser/mailboxSettings` | `await mailboxSettingsClient.update(params);` |

## ServiceProvisioningErrorsClient Endpoints

The ServiceProvisioningErrorsClient instance gives access to the following `/sites/{site-id}/pages/{baseSitePage-id}/lastModifiedByUser/serviceProvisioningErrors` endpoints. You can get a `ServiceProvisioningErrorsClient` instance like so:

```typescript
const serviceProvisioningErrorsClient = lastModifiedByUserClient.serviceProvisioningErrors;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get serviceProvisioningErrors property value | `GET /sites/{site-id}/pages/{baseSitePage-id}/lastModifiedByUser/serviceProvisioningErrors` | `await serviceProvisioningErrorsClient.list(params);` |

## PermissionsClient Endpoints

The PermissionsClient instance gives access to the following `/sites/{site-id}/permissions` endpoints. You can get a `PermissionsClient` instance like so:

```typescript
const permissionsClient = await sitesClient.permissions(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List permissions | `GET /sites/{site-id}/permissions` | `await permissionsClient.list(params);` |
| Create permission | `POST /sites/{site-id}/permissions` | `await permissionsClient.create(params);` |
| Get permission | `GET /sites/{site-id}/permissions/{permission-id}` | `await permissionsClient.get({"permission-id": permissionId  });` |
| Delete permission | `DELETE /sites/{site-id}/permissions/{permission-id}` | `await permissionsClient.delete({"permission-id": permissionId  });` |
| Update permission | `PATCH /sites/{site-id}/permissions/{permission-id}` | `await permissionsClient.update(params);` |

## GrantClient Endpoints

The GrantClient instance gives access to the following `/sites/{site-id}/permissions/{permission-id}/grant` endpoints. You can get a `GrantClient` instance like so:

```typescript
const grantClient = await permissionsClient.grant(permissionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action grant | `POST /sites/{site-id}/permissions/{permission-id}/grant` | `await grantClient.create(params);` |

## SitesClient Endpoints

The SitesClient instance gives access to the following `/sites/{site-id}/sites` endpoints. You can get a `SitesClient` instance like so:

```typescript
const sitesClient = await sitesClient.sites(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List subsites for a site | `GET /sites/{site-id}/sites` | `await sitesClient.list(params);` |
| Get sites from sites | `GET /sites/{site-id}/sites/{site-id1}` | `await sitesClient.get({"site-id1": siteId1  });` |

## TermStoreClient Endpoints

The TermStoreClient instance gives access to the following `/sites/{site-id}/termStore` endpoints. You can get a `TermStoreClient` instance like so:

```typescript
const termStoreClient = await sitesClient.termStore(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get store | `GET /sites/{site-id}/termStore` | `await termStoreClient.list(params);` |
| Delete navigation property termStore for sites | `DELETE /sites/{site-id}/termStore` | `await termStoreClient.delete({"site-id": siteId  });` |
| Update store | `PATCH /sites/{site-id}/termStore` | `await termStoreClient.update(params);` |

## GroupsClient Endpoints

The GroupsClient instance gives access to the following `/sites/{site-id}/termStore/groups` endpoints. You can get a `GroupsClient` instance like so:

```typescript
const groupsClient = termStoreClient.groups;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List termStore groups | `GET /sites/{site-id}/termStore/groups` | `await groupsClient.list(params);` |
| Create termStore group | `POST /sites/{site-id}/termStore/groups` | `await groupsClient.create(params);` |
| Get group | `GET /sites/{site-id}/termStore/groups/{group-id}` | `await groupsClient.get({"group-id": groupId  });` |
| Delete group | `DELETE /sites/{site-id}/termStore/groups/{group-id}` | `await groupsClient.delete({"group-id": groupId  });` |
| Update the navigation property groups in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}` | `await groupsClient.update(params);` |

## SetsClient Endpoints

The SetsClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets` endpoints. You can get a `SetsClient` instance like so:

```typescript
const setsClient = await groupsClient.sets(groupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List sets | `GET /sites/{site-id}/termStore/groups/{group-id}/sets` | `await setsClient.list(params);` |
| Create new navigation property to sets for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets` | `await setsClient.create(params);` |
| Get sets from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}` | `await setsClient.get({"set-id": setId  });` |
| Delete navigation property sets for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}` | `await setsClient.delete({"set-id": setId  });` |
| Update the navigation property sets in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}` | `await setsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await setsClient.children(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.get({"term-id": termId  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.delete({"term-id": termId  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await childrenClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/children/{term-id}/set` | `await setClient.list(params);` |

## ParentGroupClient Endpoints

The ParentGroupClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/parentGroup` endpoints. You can get a `ParentGroupClient` instance like so:

```typescript
const parentGroupClient = await setsClient.parentGroup(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentGroup from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.list(params);` |
| Delete navigation property parentGroup for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.delete({"set-id": setId  });` |
| Update the navigation property parentGroup in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await setsClient.relations(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## TermsClient Endpoints

The TermsClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms` endpoints. You can get a `TermsClient` instance like so:

```typescript
const termsClient = await setsClient.terms(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get term | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms` | `await termsClient.list(params);` |
| Create new navigation property to terms for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms` | `await termsClient.create(params);` |
| Get term | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.get({"term-id": termId  });` |
| Delete navigation property terms for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.delete({"term-id": termId  });` |
| Update the navigation property terms in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await termsClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await termsClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await termsClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/groups/{group-id}/sets/{set-id}/terms/{term-id}/set` | `await setClient.list(params);` |

## SetsClient Endpoints

The SetsClient instance gives access to the following `/sites/{site-id}/termStore/sets` endpoints. You can get a `SetsClient` instance like so:

```typescript
const setsClient = termStoreClient.sets;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set | `GET /sites/{site-id}/termStore/sets` | `await setsClient.list(params);` |
| Create termStore set | `POST /sites/{site-id}/termStore/sets` | `await setsClient.create(params);` |
| Get set | `GET /sites/{site-id}/termStore/sets/{set-id}` | `await setsClient.get({"set-id": setId  });` |
| Delete set | `DELETE /sites/{site-id}/termStore/sets/{set-id}` | `await setsClient.delete({"set-id": setId  });` |
| Update set | `PATCH /sites/{site-id}/termStore/sets/{set-id}` | `await setsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await setsClient.children(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List children | `GET /sites/{site-id}/termStore/sets/{set-id}/children` | `await childrenClient.list(params);` |
| Create term | `POST /sites/{site-id}/termStore/sets/{set-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}` | `await childrenClient.get({"term-id": termId  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}` | `await childrenClient.delete({"term-id": termId  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}` | `await childrenClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await childrenClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/children/{term-id}/set` | `await setClient.list(params);` |

## ParentGroupClient Endpoints

The ParentGroupClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup` endpoints. You can get a `ParentGroupClient` instance like so:

```typescript
const parentGroupClient = await setsClient.parentGroup(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentGroup from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup` | `await parentGroupClient.list(params);` |
| Delete navigation property parentGroup for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup` | `await parentGroupClient.delete({"set-id": setId  });` |
| Update the navigation property parentGroup in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup` | `await parentGroupClient.update(params);` |

## SetsClient Endpoints

The SetsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets` endpoints. You can get a `SetsClient` instance like so:

```typescript
const setsClient = parentGroupClient.sets;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sets from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets` | `await setsClient.list(params);` |
| Create new navigation property to sets for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets` | `await setsClient.create(params);` |
| Get sets from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}` | `await setsClient.get({"set-id1": setId1  });` |
| Delete navigation property sets for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}` | `await setsClient.delete({"set-id1": setId1  });` |
| Update the navigation property sets in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}` | `await setsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await setsClient.children(setId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}` | `await childrenClient.get({"term-id": termId  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}` | `await childrenClient.delete({"term-id": termId  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}` | `await childrenClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await childrenClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await setsClient.relations(setId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## TermsClient Endpoints

The TermsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms` endpoints. You can get a `TermsClient` instance like so:

```typescript
const termsClient = await setsClient.terms(setId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get terms from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms` | `await termsClient.list(params);` |
| Create new navigation property to terms for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms` | `await termsClient.create(params);` |
| Get terms from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}` | `await termsClient.get({"term-id": termId  });` |
| Delete navigation property terms for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}` | `await termsClient.delete({"term-id": termId  });` |
| Update the navigation property terms in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}` | `await termsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await termsClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await termsClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await termsClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await setsClient.relations(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List relations | `GET /sites/{site-id}/termStore/sets/{set-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## TermsClient Endpoints

The TermsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms` endpoints. You can get a `TermsClient` instance like so:

```typescript
const termsClient = await setsClient.terms(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get terms from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms` | `await termsClient.list(params);` |
| Create new navigation property to terms for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/terms` | `await termsClient.create(params);` |
| Get terms from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}` | `await termsClient.get({"term-id": termId  });` |
| Delete term | `DELETE /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}` | `await termsClient.delete({"term-id": termId  });` |
| Update term | `PATCH /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}` | `await termsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await termsClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await termsClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await termsClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStore/sets/{set-id}/terms/{term-id}/set` | `await setClient.list(params);` |

## TermStoresClient Endpoints

The TermStoresClient instance gives access to the following `/sites/{site-id}/termStores` endpoints. You can get a `TermStoresClient` instance like so:

```typescript
const termStoresClient = await sitesClient.termStores(siteId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get termStores from sites | `GET /sites/{site-id}/termStores` | `await termStoresClient.list(params);` |
| Create new navigation property to termStores for sites | `POST /sites/{site-id}/termStores` | `await termStoresClient.create(params);` |
| Get termStores from sites | `GET /sites/{site-id}/termStores/{store-id}` | `await termStoresClient.get({"store-id": storeId  });` |
| Delete navigation property termStores for sites | `DELETE /sites/{site-id}/termStores/{store-id}` | `await termStoresClient.delete({"store-id": storeId  });` |
| Update the navigation property termStores in sites | `PATCH /sites/{site-id}/termStores/{store-id}` | `await termStoresClient.update(params);` |

## GroupsClient Endpoints

The GroupsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups` endpoints. You can get a `GroupsClient` instance like so:

```typescript
const groupsClient = await termStoresClient.groups(storeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get groups from sites | `GET /sites/{site-id}/termStores/{store-id}/groups` | `await groupsClient.list(params);` |
| Create new navigation property to groups for sites | `POST /sites/{site-id}/termStores/{store-id}/groups` | `await groupsClient.create(params);` |
| Get groups from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}` | `await groupsClient.get({"group-id": groupId  });` |
| Delete navigation property groups for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}` | `await groupsClient.delete({"group-id": groupId  });` |
| Update the navigation property groups in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}` | `await groupsClient.update(params);` |

## SetsClient Endpoints

The SetsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets` endpoints. You can get a `SetsClient` instance like so:

```typescript
const setsClient = await groupsClient.sets(groupId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sets from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets` | `await setsClient.list(params);` |
| Create new navigation property to sets for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets` | `await setsClient.create(params);` |
| Get sets from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}` | `await setsClient.get({"set-id": setId  });` |
| Delete navigation property sets for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}` | `await setsClient.delete({"set-id": setId  });` |
| Update the navigation property sets in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}` | `await setsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await setsClient.children(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.get({"term-id": termId  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.delete({"term-id": termId  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await childrenClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/children/{term-id}/set` | `await setClient.list(params);` |

## ParentGroupClient Endpoints

The ParentGroupClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/parentGroup` endpoints. You can get a `ParentGroupClient` instance like so:

```typescript
const parentGroupClient = await setsClient.parentGroup(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentGroup from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.list(params);` |
| Delete navigation property parentGroup for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.delete({"set-id": setId  });` |
| Update the navigation property parentGroup in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await setsClient.relations(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## TermsClient Endpoints

The TermsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms` endpoints. You can get a `TermsClient` instance like so:

```typescript
const termsClient = await setsClient.terms(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get terms from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms` | `await termsClient.list(params);` |
| Create new navigation property to terms for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms` | `await termsClient.create(params);` |
| Get terms from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.get({"term-id": termId  });` |
| Delete navigation property terms for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.delete({"term-id": termId  });` |
| Update the navigation property terms in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await termsClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await termsClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await termsClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/groups/{group-id}/sets/{set-id}/terms/{term-id}/set` | `await setClient.list(params);` |

## SetsClient Endpoints

The SetsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets` endpoints. You can get a `SetsClient` instance like so:

```typescript
const setsClient = await termStoresClient.sets(storeId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sets from sites | `GET /sites/{site-id}/termStores/{store-id}/sets` | `await setsClient.list(params);` |
| Create new navigation property to sets for sites | `POST /sites/{site-id}/termStores/{store-id}/sets` | `await setsClient.create(params);` |
| Get sets from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}` | `await setsClient.get({"set-id": setId  });` |
| Delete navigation property sets for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}` | `await setsClient.delete({"set-id": setId  });` |
| Update the navigation property sets in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}` | `await setsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await setsClient.children(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.get({"term-id": termId  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.delete({"term-id": termId  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}` | `await childrenClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await childrenClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/children/{term-id}/set` | `await setClient.list(params);` |

## ParentGroupClient Endpoints

The ParentGroupClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup` endpoints. You can get a `ParentGroupClient` instance like so:

```typescript
const parentGroupClient = await setsClient.parentGroup(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get parentGroup from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.list(params);` |
| Delete navigation property parentGroup for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.delete({"set-id": setId  });` |
| Update the navigation property parentGroup in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup` | `await parentGroupClient.update(params);` |

## SetsClient Endpoints

The SetsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets` endpoints. You can get a `SetsClient` instance like so:

```typescript
const setsClient = parentGroupClient.sets;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sets from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets` | `await setsClient.list(params);` |
| Create new navigation property to sets for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets` | `await setsClient.create(params);` |
| Get sets from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}` | `await setsClient.get({"set-id1": setId1  });` |
| Delete navigation property sets for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}` | `await setsClient.delete({"set-id1": setId1  });` |
| Update the navigation property sets in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}` | `await setsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await setsClient.children(setId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}` | `await childrenClient.get({"term-id": termId  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}` | `await childrenClient.delete({"term-id": termId  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}` | `await childrenClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await childrenClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/children/{term-id}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await setsClient.relations(setId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## TermsClient Endpoints

The TermsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms` endpoints. You can get a `TermsClient` instance like so:

```typescript
const termsClient = await setsClient.terms(setId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get terms from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms` | `await termsClient.list(params);` |
| Create new navigation property to terms for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms` | `await termsClient.create(params);` |
| Get terms from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}` | `await termsClient.get({"term-id": termId  });` |
| Delete navigation property terms for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}` | `await termsClient.delete({"term-id": termId  });` |
| Update the navigation property terms in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}` | `await termsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await termsClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await termsClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await termsClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/parentGroup/sets/{set-id1}/terms/{term-id}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await setsClient.relations(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## TermsClient Endpoints

The TermsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms` endpoints. You can get a `TermsClient` instance like so:

```typescript
const termsClient = await setsClient.terms(setId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get terms from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms` | `await termsClient.list(params);` |
| Create new navigation property to terms for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms` | `await termsClient.create(params);` |
| Get terms from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.get({"term-id": termId  });` |
| Delete navigation property terms for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.delete({"term-id": termId  });` |
| Update the navigation property terms in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}` | `await termsClient.update(params);` |

## ChildrenClient Endpoints

The ChildrenClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children` endpoints. You can get a `ChildrenClient` instance like so:

```typescript
const childrenClient = await termsClient.children(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.list(params);` |
| Create new navigation property to children for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children` | `await childrenClient.create(params);` |
| Get children from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.get({"term-id1": termId1  });` |
| Delete navigation property children for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.delete({"term-id1": termId1  });` |
| Update the navigation property children in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}` | `await childrenClient.update(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await childrenClient.relations(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await childrenClient.set(termId1);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/children/{term-id1}/set` | `await setClient.list(params);` |

## RelationsClient Endpoints

The RelationsClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations` endpoints. You can get a `RelationsClient` instance like so:

```typescript
const relationsClient = await termsClient.relations(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.list(params);` |
| Create new navigation property to relations for sites | `POST /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations` | `await relationsClient.create(params);` |
| Get relations from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.get({"relation-id": relationId  });` |
| Delete navigation property relations for sites | `DELETE /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.delete({"relation-id": relationId  });` |
| Update the navigation property relations in sites | `PATCH /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}` | `await relationsClient.update(params);` |

## FromTermClient Endpoints

The FromTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` endpoints. You can get a `FromTermClient` instance like so:

```typescript
const fromTermClient = await relationsClient.fromTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get fromTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/fromTerm` | `await fromTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await relationsClient.set(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/set` | `await setClient.list(params);` |

## ToTermClient Endpoints

The ToTermClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` endpoints. You can get a `ToTermClient` instance like so:

```typescript
const toTermClient = await relationsClient.toTerm(relationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get toTerm from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/relations/{relation-id}/toTerm` | `await toTermClient.list(params);` |

## SetClient Endpoints

The SetClient instance gives access to the following `/sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/set` endpoints. You can get a `SetClient` instance like so:

```typescript
const setClient = await termsClient.set(termId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get set from sites | `GET /sites/{site-id}/termStores/{store-id}/sets/{set-id}/terms/{term-id}/set` | `await setClient.list(params);` |

## AddClient Endpoints

The AddClient instance gives access to the following `/sites/add` endpoints. You can get a `AddClient` instance like so:

```typescript
const addClient = sitesClient.add;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action add | `POST /sites/add` | `await addClient.create(params);` |

## RemoveClient Endpoints

The RemoveClient instance gives access to the following `/sites/remove` endpoints. You can get a `RemoveClient` instance like so:

```typescript
const removeClient = sitesClient.remove;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action remove | `POST /sites/remove` | `await removeClient.create(params);` |
