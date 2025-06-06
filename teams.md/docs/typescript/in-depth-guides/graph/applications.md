# Applications

This page lists all the `/applications` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/applications` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## ApplicationsClient Endpoints

The ApplicationsClient instance gives access to the following `/applications` endpoints. You can get a `ApplicationsClient` instance like so:

```typescript
const applicationsClient = graphClient.applications;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List applications | `GET /applications` | `await applicationsClient.list(params);` |
| Create application | `POST /applications` | `await applicationsClient.create(params);` |
| Get application | `GET /applications/{application-id}` | `await applicationsClient.get({"application-id": applicationId  });` |
| Delete application | `DELETE /applications/{application-id}` | `await applicationsClient.delete({"application-id": applicationId  });` |
| Upsert application | `PATCH /applications/{application-id}` | `await applicationsClient.update(params);` |

## AppManagementPoliciesClient Endpoints

The AppManagementPoliciesClient instance gives access to the following `/applications/{application-id}/appManagementPolicies` endpoints. You can get a `AppManagementPoliciesClient` instance like so:

```typescript
const appManagementPoliciesClient = await applicationsClient.appManagementPolicies(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get appManagementPolicies from applications | `GET /applications/{application-id}/appManagementPolicies` | `await appManagementPoliciesClient.list(params);` |

## CreatedOnBehalfOfClient Endpoints

The CreatedOnBehalfOfClient instance gives access to the following `/applications/{application-id}/createdOnBehalfOf` endpoints. You can get a `CreatedOnBehalfOfClient` instance like so:

```typescript
const createdOnBehalfOfClient = await applicationsClient.createdOnBehalfOf(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get createdOnBehalfOf from applications | `GET /applications/{application-id}/createdOnBehalfOf` | `await createdOnBehalfOfClient.list(params);` |

## ExtensionPropertiesClient Endpoints

The ExtensionPropertiesClient instance gives access to the following `/applications/{application-id}/extensionProperties` endpoints. You can get a `ExtensionPropertiesClient` instance like so:

```typescript
const extensionPropertiesClient = await applicationsClient.extensionProperties(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List extensionProperties (directory extensions) | `GET /applications/{application-id}/extensionProperties` | `await extensionPropertiesClient.list(params);` |
| Create extensionProperty (directory extension) | `POST /applications/{application-id}/extensionProperties` | `await extensionPropertiesClient.create(params);` |
| Get extensionProperty (directory extension) | `GET /applications/{application-id}/extensionProperties/{extensionProperty-id}` | `await extensionPropertiesClient.get({"extensionProperty-id": extensionPropertyId  });` |
| Delete extensionProperty (directory extension) | `DELETE /applications/{application-id}/extensionProperties/{extensionProperty-id}` | `await extensionPropertiesClient.delete({"extensionProperty-id": extensionPropertyId  });` |
| Update the navigation property extensionProperties in applications | `PATCH /applications/{application-id}/extensionProperties/{extensionProperty-id}` | `await extensionPropertiesClient.update(params);` |

## FederatedIdentityCredentialsClient Endpoints

The FederatedIdentityCredentialsClient instance gives access to the following `/applications/{application-id}/federatedIdentityCredentials` endpoints. You can get a `FederatedIdentityCredentialsClient` instance like so:

```typescript
const federatedIdentityCredentialsClient = await applicationsClient.federatedIdentityCredentials(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List federatedIdentityCredentials | `GET /applications/{application-id}/federatedIdentityCredentials` | `await federatedIdentityCredentialsClient.list(params);` |
| Create federatedIdentityCredential | `POST /applications/{application-id}/federatedIdentityCredentials` | `await federatedIdentityCredentialsClient.create(params);` |
| Get federatedIdentityCredential | `GET /applications/{application-id}/federatedIdentityCredentials/{federatedIdentityCredential-id}` | `await federatedIdentityCredentialsClient.get({"federatedIdentityCredential-id": federatedIdentityCredentialId  });` |
| Delete federatedIdentityCredential | `DELETE /applications/{application-id}/federatedIdentityCredentials/{federatedIdentityCredential-id}` | `await federatedIdentityCredentialsClient.delete({"federatedIdentityCredential-id": federatedIdentityCredentialId  });` |
| Upsert federatedIdentityCredential | `PATCH /applications/{application-id}/federatedIdentityCredentials/{federatedIdentityCredential-id}` | `await federatedIdentityCredentialsClient.update(params);` |

## HomeRealmDiscoveryPoliciesClient Endpoints

The HomeRealmDiscoveryPoliciesClient instance gives access to the following `/applications/{application-id}/homeRealmDiscoveryPolicies` endpoints. You can get a `HomeRealmDiscoveryPoliciesClient` instance like so:

```typescript
const homeRealmDiscoveryPoliciesClient = await applicationsClient.homeRealmDiscoveryPolicies(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get homeRealmDiscoveryPolicies from applications | `GET /applications/{application-id}/homeRealmDiscoveryPolicies` | `await homeRealmDiscoveryPoliciesClient.list(params);` |
| Get homeRealmDiscoveryPolicies from applications | `GET /applications/{application-id}/homeRealmDiscoveryPolicies/{homeRealmDiscoveryPolicy-id}` | `await homeRealmDiscoveryPoliciesClient.get({"homeRealmDiscoveryPolicy-id": homeRealmDiscoveryPolicyId  });` |

## LogoClient Endpoints

The LogoClient instance gives access to the following `/applications/{application-id}/logo` endpoints. You can get a `LogoClient` instance like so:

```typescript
const logoClient = await applicationsClient.logo(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get logo for application from applications | `GET /applications/{application-id}/logo` | `await logoClient.list(params);` |
| Update logo for application in applications | `PUT /applications/{application-id}/logo` | `await logoClient.set(body, {"application-id": applicationId  });` |
| Delete logo for application in applications | `DELETE /applications/{application-id}/logo` | `await logoClient.delete({"application-id": applicationId  });` |

## AddKeyClient Endpoints

The AddKeyClient instance gives access to the following `/applications/{application-id}/addKey` endpoints. You can get a `AddKeyClient` instance like so:

```typescript
const addKeyClient = await applicationsClient.addKey(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action addKey | `POST /applications/{application-id}/addKey` | `await addKeyClient.create(params);` |

## AddPasswordClient Endpoints

The AddPasswordClient instance gives access to the following `/applications/{application-id}/addPassword` endpoints. You can get a `AddPasswordClient` instance like so:

```typescript
const addPasswordClient = await applicationsClient.addPassword(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action addPassword | `POST /applications/{application-id}/addPassword` | `await addPasswordClient.create(params);` |

## CheckMemberGroupsClient Endpoints

The CheckMemberGroupsClient instance gives access to the following `/applications/{application-id}/checkMemberGroups` endpoints. You can get a `CheckMemberGroupsClient` instance like so:

```typescript
const checkMemberGroupsClient = await applicationsClient.checkMemberGroups(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action checkMemberGroups | `POST /applications/{application-id}/checkMemberGroups` | `await checkMemberGroupsClient.create(params);` |

## CheckMemberObjectsClient Endpoints

The CheckMemberObjectsClient instance gives access to the following `/applications/{application-id}/checkMemberObjects` endpoints. You can get a `CheckMemberObjectsClient` instance like so:

```typescript
const checkMemberObjectsClient = await applicationsClient.checkMemberObjects(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action checkMemberObjects | `POST /applications/{application-id}/checkMemberObjects` | `await checkMemberObjectsClient.create(params);` |

## GetMemberGroupsClient Endpoints

The GetMemberGroupsClient instance gives access to the following `/applications/{application-id}/getMemberGroups` endpoints. You can get a `GetMemberGroupsClient` instance like so:

```typescript
const getMemberGroupsClient = await applicationsClient.getMemberGroups(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getMemberGroups | `POST /applications/{application-id}/getMemberGroups` | `await getMemberGroupsClient.create(params);` |

## GetMemberObjectsClient Endpoints

The GetMemberObjectsClient instance gives access to the following `/applications/{application-id}/getMemberObjects` endpoints. You can get a `GetMemberObjectsClient` instance like so:

```typescript
const getMemberObjectsClient = await applicationsClient.getMemberObjects(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getMemberObjects | `POST /applications/{application-id}/getMemberObjects` | `await getMemberObjectsClient.create(params);` |

## RemoveKeyClient Endpoints

The RemoveKeyClient instance gives access to the following `/applications/{application-id}/removeKey` endpoints. You can get a `RemoveKeyClient` instance like so:

```typescript
const removeKeyClient = await applicationsClient.removeKey(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action removeKey | `POST /applications/{application-id}/removeKey` | `await removeKeyClient.create(params);` |

## RemovePasswordClient Endpoints

The RemovePasswordClient instance gives access to the following `/applications/{application-id}/removePassword` endpoints. You can get a `RemovePasswordClient` instance like so:

```typescript
const removePasswordClient = await applicationsClient.removePassword(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action removePassword | `POST /applications/{application-id}/removePassword` | `await removePasswordClient.create(params);` |

## RestoreClient Endpoints

The RestoreClient instance gives access to the following `/applications/{application-id}/restore` endpoints. You can get a `RestoreClient` instance like so:

```typescript
const restoreClient = await applicationsClient.restore(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action restore | `POST /applications/{application-id}/restore` | `await restoreClient.create(params);` |

## SetVerifiedPublisherClient Endpoints

The SetVerifiedPublisherClient instance gives access to the following `/applications/{application-id}/setVerifiedPublisher` endpoints. You can get a `SetVerifiedPublisherClient` instance like so:

```typescript
const setVerifiedPublisherClient = await applicationsClient.setVerifiedPublisher(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setVerifiedPublisher | `POST /applications/{application-id}/setVerifiedPublisher` | `await setVerifiedPublisherClient.create(params);` |

## UnsetVerifiedPublisherClient Endpoints

The UnsetVerifiedPublisherClient instance gives access to the following `/applications/{application-id}/unsetVerifiedPublisher` endpoints. You can get a `UnsetVerifiedPublisherClient` instance like so:

```typescript
const unsetVerifiedPublisherClient = await applicationsClient.unsetVerifiedPublisher(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unsetVerifiedPublisher | `POST /applications/{application-id}/unsetVerifiedPublisher` | `await unsetVerifiedPublisherClient.create(params);` |

## OwnersClient Endpoints

The OwnersClient instance gives access to the following `/applications/{application-id}/owners` endpoints. You can get a `OwnersClient` instance like so:

```typescript
const ownersClient = await applicationsClient.owners(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List owners of an application | `GET /applications/{application-id}/owners` | `await ownersClient.list(params);` |

## SynchronizationClient Endpoints

The SynchronizationClient instance gives access to the following `/applications/{application-id}/synchronization` endpoints. You can get a `SynchronizationClient` instance like so:

```typescript
const synchronizationClient = await applicationsClient.synchronization(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get synchronization from applications | `GET /applications/{application-id}/synchronization` | `await synchronizationClient.list(params);` |
| Update the navigation property synchronization in applications | `PUT /applications/{application-id}/synchronization` | `await synchronizationClient.set(body, {"application-id": applicationId  });` |
| Delete navigation property synchronization for applications | `DELETE /applications/{application-id}/synchronization` | `await synchronizationClient.delete({"application-id": applicationId  });` |

## JobsClient Endpoints

The JobsClient instance gives access to the following `/applications/{application-id}/synchronization/jobs` endpoints. You can get a `JobsClient` instance like so:

```typescript
const jobsClient = synchronizationClient.jobs;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get jobs from applications | `GET /applications/{application-id}/synchronization/jobs` | `await jobsClient.list(params);` |
| Create new navigation property to jobs for applications | `POST /applications/{application-id}/synchronization/jobs` | `await jobsClient.create(params);` |
| Get jobs from applications | `GET /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}` | `await jobsClient.get({"synchronizationJob-id": synchronizationJobId  });` |
| Delete navigation property jobs for applications | `DELETE /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}` | `await jobsClient.delete({"synchronizationJob-id": synchronizationJobId  });` |
| Update the navigation property jobs in applications | `PATCH /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}` | `await jobsClient.update(params);` |

## BulkUploadClient Endpoints

The BulkUploadClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/bulkUpload` endpoints. You can get a `BulkUploadClient` instance like so:

```typescript
const bulkUploadClient = await jobsClient.bulkUpload(synchronizationJobId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get bulkUpload from applications | `GET /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/bulkUpload` | `await bulkUploadClient.list(params);` |
| Delete navigation property bulkUpload for applications | `DELETE /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/bulkUpload` | `await bulkUploadClient.delete({"synchronizationJob-id": synchronizationJobId  });` |
| Update the navigation property bulkUpload in applications | `PATCH /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/bulkUpload` | `await bulkUploadClient.update(params);` |

## PauseClient Endpoints

The PauseClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/pause` endpoints. You can get a `PauseClient` instance like so:

```typescript
const pauseClient = await jobsClient.pause(synchronizationJobId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action pause | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/pause` | `await pauseClient.create(params);` |

## ProvisionOnDemandClient Endpoints

The ProvisionOnDemandClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/provisionOnDemand` endpoints. You can get a `ProvisionOnDemandClient` instance like so:

```typescript
const provisionOnDemandClient = await jobsClient.provisionOnDemand(synchronizationJobId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action provisionOnDemand | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/provisionOnDemand` | `await provisionOnDemandClient.create(params);` |

## RestartClient Endpoints

The RestartClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/restart` endpoints. You can get a `RestartClient` instance like so:

```typescript
const restartClient = await jobsClient.restart(synchronizationJobId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action restart | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/restart` | `await restartClient.create(params);` |

## StartClient Endpoints

The StartClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/start` endpoints. You can get a `StartClient` instance like so:

```typescript
const startClient = await jobsClient.start(synchronizationJobId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action start | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/start` | `await startClient.create(params);` |

## ValidateCredentialsClient Endpoints

The ValidateCredentialsClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/validateCredentials` endpoints. You can get a `ValidateCredentialsClient` instance like so:

```typescript
const validateCredentialsClient = await jobsClient.validateCredentials(synchronizationJobId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action validateCredentials | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/validateCredentials` | `await validateCredentialsClient.create(params);` |

## SchemaClient Endpoints

The SchemaClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema` endpoints. You can get a `SchemaClient` instance like so:

```typescript
const schemaClient = await jobsClient.schema(synchronizationJobId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get schema from applications | `GET /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema` | `await schemaClient.list(params);` |
| Delete navigation property schema for applications | `DELETE /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema` | `await schemaClient.delete({"synchronizationJob-id": synchronizationJobId  });` |
| Update the navigation property schema in applications | `PATCH /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema` | `await schemaClient.update(params);` |

## DirectoriesClient Endpoints

The DirectoriesClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories` endpoints. You can get a `DirectoriesClient` instance like so:

```typescript
const directoriesClient = schemaClient.directories;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get directories from applications | `GET /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories` | `await directoriesClient.list(params);` |
| Create new navigation property to directories for applications | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories` | `await directoriesClient.create(params);` |
| Get directories from applications | `GET /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories/{directoryDefinition-id}` | `await directoriesClient.get({"directoryDefinition-id": directoryDefinitionId  });` |
| Delete navigation property directories for applications | `DELETE /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories/{directoryDefinition-id}` | `await directoriesClient.delete({"directoryDefinition-id": directoryDefinitionId  });` |
| Update the navigation property directories in applications | `PATCH /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories/{directoryDefinition-id}` | `await directoriesClient.update(params);` |

## DiscoverClient Endpoints

The DiscoverClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories/{directoryDefinition-id}/discover` endpoints. You can get a `DiscoverClient` instance like so:

```typescript
const discoverClient = await directoriesClient.discover(directoryDefinitionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action discover | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/directories/{directoryDefinition-id}/discover` | `await discoverClient.create(params);` |

## ParseExpressionClient Endpoints

The ParseExpressionClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/parseExpression` endpoints. You can get a `ParseExpressionClient` instance like so:

```typescript
const parseExpressionClient = schemaClient.parseExpression;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action parseExpression | `POST /applications/{application-id}/synchronization/jobs/{synchronizationJob-id}/schema/parseExpression` | `await parseExpressionClient.create(params);` |

## ValidateCredentialsClient Endpoints

The ValidateCredentialsClient instance gives access to the following `/applications/{application-id}/synchronization/jobs/validateCredentials` endpoints. You can get a `ValidateCredentialsClient` instance like so:

```typescript
const validateCredentialsClient = jobsClient.validateCredentials;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action validateCredentials | `POST /applications/{application-id}/synchronization/jobs/validateCredentials` | `await validateCredentialsClient.create(params);` |

## AcquireAccessTokenClient Endpoints

The AcquireAccessTokenClient instance gives access to the following `/applications/{application-id}/synchronization/acquireAccessToken` endpoints. You can get a `AcquireAccessTokenClient` instance like so:

```typescript
const acquireAccessTokenClient = synchronizationClient.acquireAccessToken;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action acquireAccessToken | `POST /applications/{application-id}/synchronization/acquireAccessToken` | `await acquireAccessTokenClient.create(params);` |

## SecretsClient Endpoints

The SecretsClient instance gives access to the following `/applications/{application-id}/synchronization/secrets` endpoints. You can get a `SecretsClient` instance like so:

```typescript
const secretsClient = synchronizationClient.secrets;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Update property secrets value. | `PUT /applications/{application-id}/synchronization/secrets` | `await secretsClient.set(body, {"":   });` |

## TemplatesClient Endpoints

The TemplatesClient instance gives access to the following `/applications/{application-id}/synchronization/templates` endpoints. You can get a `TemplatesClient` instance like so:

```typescript
const templatesClient = synchronizationClient.templates;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get templates from applications | `GET /applications/{application-id}/synchronization/templates` | `await templatesClient.list(params);` |
| Create new navigation property to templates for applications | `POST /applications/{application-id}/synchronization/templates` | `await templatesClient.create(params);` |
| Get templates from applications | `GET /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}` | `await templatesClient.get({"synchronizationTemplate-id": synchronizationTemplateId  });` |
| Delete navigation property templates for applications | `DELETE /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}` | `await templatesClient.delete({"synchronizationTemplate-id": synchronizationTemplateId  });` |
| Update synchronizationTemplate | `PATCH /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}` | `await templatesClient.update(params);` |

## SchemaClient Endpoints

The SchemaClient instance gives access to the following `/applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema` endpoints. You can get a `SchemaClient` instance like so:

```typescript
const schemaClient = await templatesClient.schema(synchronizationTemplateId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get schema from applications | `GET /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema` | `await schemaClient.list(params);` |
| Delete navigation property schema for applications | `DELETE /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema` | `await schemaClient.delete({"synchronizationTemplate-id": synchronizationTemplateId  });` |
| Update the navigation property schema in applications | `PATCH /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema` | `await schemaClient.update(params);` |

## DirectoriesClient Endpoints

The DirectoriesClient instance gives access to the following `/applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories` endpoints. You can get a `DirectoriesClient` instance like so:

```typescript
const directoriesClient = schemaClient.directories;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get directories from applications | `GET /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories` | `await directoriesClient.list(params);` |
| Create new navigation property to directories for applications | `POST /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories` | `await directoriesClient.create(params);` |
| Get directories from applications | `GET /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories/{directoryDefinition-id}` | `await directoriesClient.get({"directoryDefinition-id": directoryDefinitionId  });` |
| Delete navigation property directories for applications | `DELETE /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories/{directoryDefinition-id}` | `await directoriesClient.delete({"directoryDefinition-id": directoryDefinitionId  });` |
| Update the navigation property directories in applications | `PATCH /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories/{directoryDefinition-id}` | `await directoriesClient.update(params);` |

## DiscoverClient Endpoints

The DiscoverClient instance gives access to the following `/applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories/{directoryDefinition-id}/discover` endpoints. You can get a `DiscoverClient` instance like so:

```typescript
const discoverClient = await directoriesClient.discover(directoryDefinitionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action discover | `POST /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/directories/{directoryDefinition-id}/discover` | `await discoverClient.create(params);` |

## ParseExpressionClient Endpoints

The ParseExpressionClient instance gives access to the following `/applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/parseExpression` endpoints. You can get a `ParseExpressionClient` instance like so:

```typescript
const parseExpressionClient = schemaClient.parseExpression;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action parseExpression | `POST /applications/{application-id}/synchronization/templates/{synchronizationTemplate-id}/schema/parseExpression` | `await parseExpressionClient.create(params);` |

## TokenIssuancePoliciesClient Endpoints

The TokenIssuancePoliciesClient instance gives access to the following `/applications/{application-id}/tokenIssuancePolicies` endpoints. You can get a `TokenIssuancePoliciesClient` instance like so:

```typescript
const tokenIssuancePoliciesClient = await applicationsClient.tokenIssuancePolicies(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List assigned tokenIssuancePolicies | `GET /applications/{application-id}/tokenIssuancePolicies` | `await tokenIssuancePoliciesClient.list(params);` |

## TokenLifetimePoliciesClient Endpoints

The TokenLifetimePoliciesClient instance gives access to the following `/applications/{application-id}/tokenLifetimePolicies` endpoints. You can get a `TokenLifetimePoliciesClient` instance like so:

```typescript
const tokenLifetimePoliciesClient = await applicationsClient.tokenLifetimePolicies(applicationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List assigned tokenLifetimePolicies | `GET /applications/{application-id}/tokenLifetimePolicies` | `await tokenLifetimePoliciesClient.list(params);` |

## GetAvailableExtensionPropertiesClient Endpoints

The GetAvailableExtensionPropertiesClient instance gives access to the following `/applications/getAvailableExtensionProperties` endpoints. You can get a `GetAvailableExtensionPropertiesClient` instance like so:

```typescript
const getAvailableExtensionPropertiesClient = applicationsClient.getAvailableExtensionProperties;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getAvailableExtensionProperties | `POST /applications/getAvailableExtensionProperties` | `await getAvailableExtensionPropertiesClient.create(params);` |

## GetByIdsClient Endpoints

The GetByIdsClient instance gives access to the following `/applications/getByIds` endpoints. You can get a `GetByIdsClient` instance like so:

```typescript
const getByIdsClient = applicationsClient.getByIds;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getByIds | `POST /applications/getByIds` | `await getByIdsClient.create(params);` |

## ValidatePropertiesClient Endpoints

The ValidatePropertiesClient instance gives access to the following `/applications/validateProperties` endpoints. You can get a `ValidatePropertiesClient` instance like so:

```typescript
const validatePropertiesClient = applicationsClient.validateProperties;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action validateProperties | `POST /applications/validateProperties` | `await validatePropertiesClient.create(params);` |
