# Employee Experience

This page lists all the `/employeeExperience` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/employeeExperience` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/engagement-api-overview?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## LearningProvidersClient Endpoints

The LearningProvidersClient instance gives access to the following `/employeeExperience/learningProviders` endpoints. You can get a `LearningProvidersClient` instance like so:

```typescript
const learningProvidersClient = employeeExperienceClient.learningProviders;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List learningProviders | `GET /employeeExperience/learningProviders` | `await learningProvidersClient.list(params);` |
| Create learningProvider | `POST /employeeExperience/learningProviders` | `await learningProvidersClient.create(params);` |
| Get learningProvider | `GET /employeeExperience/learningProviders/{learningProvider-id}` | `await learningProvidersClient.get({"learningProvider-id": learningProviderId  });` |
| Delete learningProvider | `DELETE /employeeExperience/learningProviders/{learningProvider-id}` | `await learningProvidersClient.delete({"learningProvider-id": learningProviderId  });` |
| Update learningProvider | `PATCH /employeeExperience/learningProviders/{learningProvider-id}` | `await learningProvidersClient.update(params);` |

## LearningContentsClient Endpoints

The LearningContentsClient instance gives access to the following `/employeeExperience/learningProviders/{learningProvider-id}/learningContents` endpoints. You can get a `LearningContentsClient` instance like so:

```typescript
const learningContentsClient = await learningProvidersClient.learningContents(learningProviderId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List learningContents | `GET /employeeExperience/learningProviders/{learningProvider-id}/learningContents` | `await learningContentsClient.list(params);` |
| Create new navigation property to learningContents for employeeExperience | `POST /employeeExperience/learningProviders/{learningProvider-id}/learningContents` | `await learningContentsClient.create(params);` |
| Get learningContent | `GET /employeeExperience/learningProviders/{learningProvider-id}/learningContents/{learningContent-id}` | `await learningContentsClient.get({"learningContent-id": learningContentId  });` |
| Delete learningContent | `DELETE /employeeExperience/learningProviders/{learningProvider-id}/learningContents/{learningContent-id}` | `await learningContentsClient.delete({"learningContent-id": learningContentId  });` |
| Update the navigation property learningContents in employeeExperience | `PATCH /employeeExperience/learningProviders/{learningProvider-id}/learningContents/{learningContent-id}` | `await learningContentsClient.update(params);` |

## LearningCourseActivitiesClient Endpoints

The LearningCourseActivitiesClient instance gives access to the following `/employeeExperience/learningProviders/{learningProvider-id}/learningCourseActivities` endpoints. You can get a `LearningCourseActivitiesClient` instance like so:

```typescript
const learningCourseActivitiesClient = await learningProvidersClient.learningCourseActivities(learningProviderId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get learningCourseActivity | `GET /employeeExperience/learningProviders/{learningProvider-id}/learningCourseActivities` | `await learningCourseActivitiesClient.list(params);` |
| Create learningCourseActivity | `POST /employeeExperience/learningProviders/{learningProvider-id}/learningCourseActivities` | `await learningCourseActivitiesClient.create(params);` |
| Get learningCourseActivities from employeeExperience | `GET /employeeExperience/learningProviders/{learningProvider-id}/learningCourseActivities/{learningCourseActivity-id}` | `await learningCourseActivitiesClient.get({"learningCourseActivity-id": learningCourseActivityId  });` |
| Delete learningCourseActivity | `DELETE /employeeExperience/learningProviders/{learningProvider-id}/learningCourseActivities/{learningCourseActivity-id}` | `await learningCourseActivitiesClient.delete({"learningCourseActivity-id": learningCourseActivityId  });` |
| Update learningCourseActivity | `PATCH /employeeExperience/learningProviders/{learningProvider-id}/learningCourseActivities/{learningCourseActivity-id}` | `await learningCourseActivitiesClient.update(params);` |
