# Solutions

This page lists all the `/solutions` graph endpoints that are currently supported in the Graph API Client. The supported endpoints are made available as type-safe and convenient methods following a consistent pattern.

You can find the full documentation for the `/solutions` endpoints in the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0), including details on input arguments, return data, required permissions, and endpoint availability.

## Getting Started

To get started with the Graph Client, please refer to the [Graph API Client Essentials](../../essentials/graph) page.


## SolutionsClient Endpoints

The SolutionsClient instance gives access to the following `/solutions` endpoints. You can get a `SolutionsClient` instance like so:

```typescript
const solutionsClient = graphClient.solutions;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get solutions | `GET /solutions` | `await solutionsClient.list(params);` |
| Update solutions | `PATCH /solutions` | `await solutionsClient.update(params);` |

## BackupRestoreClient Endpoints

The BackupRestoreClient instance gives access to the following `/solutions/backupRestore` endpoints. You can get a `BackupRestoreClient` instance like so:

```typescript
const backupRestoreClient = solutionsClient.backupRestore;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get backupRestoreRoot | `GET /solutions/backupRestore` | `await backupRestoreClient.list(params);` |
| Delete navigation property backupRestore for solutions | `DELETE /solutions/backupRestore` | `await backupRestoreClient.delete({"":   });` |
| Update the navigation property backupRestore in solutions | `PATCH /solutions/backupRestore` | `await backupRestoreClient.update(params);` |

## DriveInclusionRulesClient Endpoints

The DriveInclusionRulesClient instance gives access to the following `/solutions/backupRestore/driveInclusionRules` endpoints. You can get a `DriveInclusionRulesClient` instance like so:

```typescript
const driveInclusionRulesClient = backupRestoreClient.driveInclusionRules;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get driveInclusionRules from solutions | `GET /solutions/backupRestore/driveInclusionRules` | `await driveInclusionRulesClient.list(params);` |
| Create new navigation property to driveInclusionRules for solutions | `POST /solutions/backupRestore/driveInclusionRules` | `await driveInclusionRulesClient.create(params);` |
| Get driveInclusionRules from solutions | `GET /solutions/backupRestore/driveInclusionRules/{driveProtectionRule-id}` | `await driveInclusionRulesClient.get({"driveProtectionRule-id": driveProtectionRuleId  });` |
| Delete navigation property driveInclusionRules for solutions | `DELETE /solutions/backupRestore/driveInclusionRules/{driveProtectionRule-id}` | `await driveInclusionRulesClient.delete({"driveProtectionRule-id": driveProtectionRuleId  });` |
| Update the navigation property driveInclusionRules in solutions | `PATCH /solutions/backupRestore/driveInclusionRules/{driveProtectionRule-id}` | `await driveInclusionRulesClient.update(params);` |

## DriveProtectionUnitsClient Endpoints

The DriveProtectionUnitsClient instance gives access to the following `/solutions/backupRestore/driveProtectionUnits` endpoints. You can get a `DriveProtectionUnitsClient` instance like so:

```typescript
const driveProtectionUnitsClient = backupRestoreClient.driveProtectionUnits;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get driveProtectionUnits from solutions | `GET /solutions/backupRestore/driveProtectionUnits` | `await driveProtectionUnitsClient.list(params);` |
| Create new navigation property to driveProtectionUnits for solutions | `POST /solutions/backupRestore/driveProtectionUnits` | `await driveProtectionUnitsClient.create(params);` |
| Get driveProtectionUnits from solutions | `GET /solutions/backupRestore/driveProtectionUnits/{driveProtectionUnit-id}` | `await driveProtectionUnitsClient.get({"driveProtectionUnit-id": driveProtectionUnitId  });` |
| Delete navigation property driveProtectionUnits for solutions | `DELETE /solutions/backupRestore/driveProtectionUnits/{driveProtectionUnit-id}` | `await driveProtectionUnitsClient.delete({"driveProtectionUnit-id": driveProtectionUnitId  });` |
| Update the navigation property driveProtectionUnits in solutions | `PATCH /solutions/backupRestore/driveProtectionUnits/{driveProtectionUnit-id}` | `await driveProtectionUnitsClient.update(params);` |

## ExchangeProtectionPoliciesClient Endpoints

The ExchangeProtectionPoliciesClient instance gives access to the following `/solutions/backupRestore/exchangeProtectionPolicies` endpoints. You can get a `ExchangeProtectionPoliciesClient` instance like so:

```typescript
const exchangeProtectionPoliciesClient = backupRestoreClient.exchangeProtectionPolicies;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get exchangeProtectionPolicies from solutions | `GET /solutions/backupRestore/exchangeProtectionPolicies` | `await exchangeProtectionPoliciesClient.list(params);` |
| Create exchangeProtectionPolicy | `POST /solutions/backupRestore/exchangeProtectionPolicies` | `await exchangeProtectionPoliciesClient.create(params);` |
| Get exchangeProtectionPolicies from solutions | `GET /solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}` | `await exchangeProtectionPoliciesClient.get({"exchangeProtectionPolicy-id": exchangeProtectionPolicyId  });` |
| Delete navigation property exchangeProtectionPolicies for solutions | `DELETE /solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}` | `await exchangeProtectionPoliciesClient.delete({"exchangeProtectionPolicy-id": exchangeProtectionPolicyId  });` |
| Update exchangeProtectionPolicy | `PATCH /solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}` | `await exchangeProtectionPoliciesClient.update(params);` |

## MailboxInclusionRulesClient Endpoints

The MailboxInclusionRulesClient instance gives access to the following `/solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}/mailboxInclusionRules` endpoints. You can get a `MailboxInclusionRulesClient` instance like so:

```typescript
const mailboxInclusionRulesClient = await exchangeProtectionPoliciesClient.mailboxInclusionRules(exchangeProtectionPolicyId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List mailboxInclusionRules | `GET /solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}/mailboxInclusionRules` | `await mailboxInclusionRulesClient.list(params);` |
| Get protectionRuleBase | `GET /solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}/mailboxInclusionRules/{mailboxProtectionRule-id}` | `await mailboxInclusionRulesClient.get({"mailboxProtectionRule-id": mailboxProtectionRuleId  });` |

## MailboxProtectionUnitsClient Endpoints

The MailboxProtectionUnitsClient instance gives access to the following `/solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}/mailboxProtectionUnits` endpoints. You can get a `MailboxProtectionUnitsClient` instance like so:

```typescript
const mailboxProtectionUnitsClient = await exchangeProtectionPoliciesClient.mailboxProtectionUnits(exchangeProtectionPolicyId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxProtectionUnits from solutions | `GET /solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}/mailboxProtectionUnits` | `await mailboxProtectionUnitsClient.list(params);` |
| Get mailboxProtectionUnits from solutions | `GET /solutions/backupRestore/exchangeProtectionPolicies/{exchangeProtectionPolicy-id}/mailboxProtectionUnits/{mailboxProtectionUnit-id}` | `await mailboxProtectionUnitsClient.get({"mailboxProtectionUnit-id": mailboxProtectionUnitId  });` |

## ExchangeRestoreSessionsClient Endpoints

The ExchangeRestoreSessionsClient instance gives access to the following `/solutions/backupRestore/exchangeRestoreSessions` endpoints. You can get a `ExchangeRestoreSessionsClient` instance like so:

```typescript
const exchangeRestoreSessionsClient = backupRestoreClient.exchangeRestoreSessions;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get exchangeRestoreSessions from solutions | `GET /solutions/backupRestore/exchangeRestoreSessions` | `await exchangeRestoreSessionsClient.list(params);` |
| Create new navigation property to exchangeRestoreSessions for solutions | `POST /solutions/backupRestore/exchangeRestoreSessions` | `await exchangeRestoreSessionsClient.create(params);` |
| Get exchangeRestoreSessions from solutions | `GET /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}` | `await exchangeRestoreSessionsClient.get({"exchangeRestoreSession-id": exchangeRestoreSessionId  });` |
| Delete navigation property exchangeRestoreSessions for solutions | `DELETE /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}` | `await exchangeRestoreSessionsClient.delete({"exchangeRestoreSession-id": exchangeRestoreSessionId  });` |
| Update exchangeRestoreSession | `PATCH /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}` | `await exchangeRestoreSessionsClient.update(params);` |

## GranularMailboxRestoreArtifactsClient Endpoints

The GranularMailboxRestoreArtifactsClient instance gives access to the following `/solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts` endpoints. You can get a `GranularMailboxRestoreArtifactsClient` instance like so:

```typescript
const granularMailboxRestoreArtifactsClient = await exchangeRestoreSessionsClient.granularMailboxRestoreArtifacts(exchangeRestoreSessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get granularMailboxRestoreArtifacts from solutions | `GET /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts` | `await granularMailboxRestoreArtifactsClient.list(params);` |
| Create new navigation property to granularMailboxRestoreArtifacts for solutions | `POST /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts` | `await granularMailboxRestoreArtifactsClient.create(params);` |
| Get granularMailboxRestoreArtifacts from solutions | `GET /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts/{granularMailboxRestoreArtifact-id}` | `await granularMailboxRestoreArtifactsClient.get({"granularMailboxRestoreArtifact-id": granularMailboxRestoreArtifactId  });` |
| Delete navigation property granularMailboxRestoreArtifacts for solutions | `DELETE /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts/{granularMailboxRestoreArtifact-id}` | `await granularMailboxRestoreArtifactsClient.delete({"granularMailboxRestoreArtifact-id": granularMailboxRestoreArtifactId  });` |
| Update the navigation property granularMailboxRestoreArtifacts in solutions | `PATCH /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts/{granularMailboxRestoreArtifact-id}` | `await granularMailboxRestoreArtifactsClient.update(params);` |

## RestorePointClient Endpoints

The RestorePointClient instance gives access to the following `/solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts/{granularMailboxRestoreArtifact-id}/restorePoint` endpoints. You can get a `RestorePointClient` instance like so:

```typescript
const restorePointClient = await granularMailboxRestoreArtifactsClient.restorePoint(granularMailboxRestoreArtifactId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get restorePoint from solutions | `GET /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/granularMailboxRestoreArtifacts/{granularMailboxRestoreArtifact-id}/restorePoint` | `await restorePointClient.list(params);` |

## MailboxRestoreArtifactsClient Endpoints

The MailboxRestoreArtifactsClient instance gives access to the following `/solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts` endpoints. You can get a `MailboxRestoreArtifactsClient` instance like so:

```typescript
const mailboxRestoreArtifactsClient = await exchangeRestoreSessionsClient.mailboxRestoreArtifacts(exchangeRestoreSessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List mailboxRestoreArtifacts | `GET /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts` | `await mailboxRestoreArtifactsClient.list(params);` |
| Create new navigation property to mailboxRestoreArtifacts for solutions | `POST /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts` | `await mailboxRestoreArtifactsClient.create(params);` |
| Get mailboxRestoreArtifacts from solutions | `GET /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts/{mailboxRestoreArtifact-id}` | `await mailboxRestoreArtifactsClient.get({"mailboxRestoreArtifact-id": mailboxRestoreArtifactId  });` |
| Delete navigation property mailboxRestoreArtifacts for solutions | `DELETE /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts/{mailboxRestoreArtifact-id}` | `await mailboxRestoreArtifactsClient.delete({"mailboxRestoreArtifact-id": mailboxRestoreArtifactId  });` |
| Update the navigation property mailboxRestoreArtifacts in solutions | `PATCH /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts/{mailboxRestoreArtifact-id}` | `await mailboxRestoreArtifactsClient.update(params);` |

## RestorePointClient Endpoints

The RestorePointClient instance gives access to the following `/solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts/{mailboxRestoreArtifact-id}/restorePoint` endpoints. You can get a `RestorePointClient` instance like so:

```typescript
const restorePointClient = await mailboxRestoreArtifactsClient.restorePoint(mailboxRestoreArtifactId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get restorePoint from solutions | `GET /solutions/backupRestore/exchangeRestoreSessions/{exchangeRestoreSession-id}/mailboxRestoreArtifacts/{mailboxRestoreArtifact-id}/restorePoint` | `await restorePointClient.list(params);` |

## MailboxInclusionRulesClient Endpoints

The MailboxInclusionRulesClient instance gives access to the following `/solutions/backupRestore/mailboxInclusionRules` endpoints. You can get a `MailboxInclusionRulesClient` instance like so:

```typescript
const mailboxInclusionRulesClient = backupRestoreClient.mailboxInclusionRules;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxInclusionRules from solutions | `GET /solutions/backupRestore/mailboxInclusionRules` | `await mailboxInclusionRulesClient.list(params);` |
| Create new navigation property to mailboxInclusionRules for solutions | `POST /solutions/backupRestore/mailboxInclusionRules` | `await mailboxInclusionRulesClient.create(params);` |
| Get mailboxInclusionRules from solutions | `GET /solutions/backupRestore/mailboxInclusionRules/{mailboxProtectionRule-id}` | `await mailboxInclusionRulesClient.get({"mailboxProtectionRule-id": mailboxProtectionRuleId  });` |
| Delete navigation property mailboxInclusionRules for solutions | `DELETE /solutions/backupRestore/mailboxInclusionRules/{mailboxProtectionRule-id}` | `await mailboxInclusionRulesClient.delete({"mailboxProtectionRule-id": mailboxProtectionRuleId  });` |
| Update the navigation property mailboxInclusionRules in solutions | `PATCH /solutions/backupRestore/mailboxInclusionRules/{mailboxProtectionRule-id}` | `await mailboxInclusionRulesClient.update(params);` |

## MailboxProtectionUnitsClient Endpoints

The MailboxProtectionUnitsClient instance gives access to the following `/solutions/backupRestore/mailboxProtectionUnits` endpoints. You can get a `MailboxProtectionUnitsClient` instance like so:

```typescript
const mailboxProtectionUnitsClient = backupRestoreClient.mailboxProtectionUnits;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get mailboxProtectionUnits from solutions | `GET /solutions/backupRestore/mailboxProtectionUnits` | `await mailboxProtectionUnitsClient.list(params);` |
| Create new navigation property to mailboxProtectionUnits for solutions | `POST /solutions/backupRestore/mailboxProtectionUnits` | `await mailboxProtectionUnitsClient.create(params);` |
| Get mailboxProtectionUnits from solutions | `GET /solutions/backupRestore/mailboxProtectionUnits/{mailboxProtectionUnit-id}` | `await mailboxProtectionUnitsClient.get({"mailboxProtectionUnit-id": mailboxProtectionUnitId  });` |
| Delete navigation property mailboxProtectionUnits for solutions | `DELETE /solutions/backupRestore/mailboxProtectionUnits/{mailboxProtectionUnit-id}` | `await mailboxProtectionUnitsClient.delete({"mailboxProtectionUnit-id": mailboxProtectionUnitId  });` |
| Update the navigation property mailboxProtectionUnits in solutions | `PATCH /solutions/backupRestore/mailboxProtectionUnits/{mailboxProtectionUnit-id}` | `await mailboxProtectionUnitsClient.update(params);` |

## EnableClient Endpoints

The EnableClient instance gives access to the following `/solutions/backupRestore/enable` endpoints. You can get a `EnableClient` instance like so:

```typescript
const enableClient = backupRestoreClient.enable;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action enable | `POST /solutions/backupRestore/enable` | `await enableClient.create(params);` |

## OneDriveForBusinessProtectionPoliciesClient Endpoints

The OneDriveForBusinessProtectionPoliciesClient instance gives access to the following `/solutions/backupRestore/oneDriveForBusinessProtectionPolicies` endpoints. You can get a `OneDriveForBusinessProtectionPoliciesClient` instance like so:

```typescript
const oneDriveForBusinessProtectionPoliciesClient = backupRestoreClient.oneDriveForBusinessProtectionPolicies;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get oneDriveForBusinessProtectionPolicies from solutions | `GET /solutions/backupRestore/oneDriveForBusinessProtectionPolicies` | `await oneDriveForBusinessProtectionPoliciesClient.list(params);` |
| Create oneDriveForBusinessProtectionPolicy | `POST /solutions/backupRestore/oneDriveForBusinessProtectionPolicies` | `await oneDriveForBusinessProtectionPoliciesClient.create(params);` |
| Get oneDriveForBusinessProtectionPolicies from solutions | `GET /solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}` | `await oneDriveForBusinessProtectionPoliciesClient.get({"oneDriveForBusinessProtectionPolicy-id": oneDriveForBusinessProtectionPolicyId  });` |
| Delete navigation property oneDriveForBusinessProtectionPolicies for solutions | `DELETE /solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}` | `await oneDriveForBusinessProtectionPoliciesClient.delete({"oneDriveForBusinessProtectionPolicy-id": oneDriveForBusinessProtectionPolicyId  });` |
| Update oneDriveForBusinessProtectionPolicy | `PATCH /solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}` | `await oneDriveForBusinessProtectionPoliciesClient.update(params);` |

## DriveInclusionRulesClient Endpoints

The DriveInclusionRulesClient instance gives access to the following `/solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}/driveInclusionRules` endpoints. You can get a `DriveInclusionRulesClient` instance like so:

```typescript
const driveInclusionRulesClient = await oneDriveForBusinessProtectionPoliciesClient.driveInclusionRules(oneDriveForBusinessProtectionPolicyId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List driveInclusionRules | `GET /solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}/driveInclusionRules` | `await driveInclusionRulesClient.list(params);` |
| Get protectionRuleBase | `GET /solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}/driveInclusionRules/{driveProtectionRule-id}` | `await driveInclusionRulesClient.get({"driveProtectionRule-id": driveProtectionRuleId  });` |

## DriveProtectionUnitsClient Endpoints

The DriveProtectionUnitsClient instance gives access to the following `/solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}/driveProtectionUnits` endpoints. You can get a `DriveProtectionUnitsClient` instance like so:

```typescript
const driveProtectionUnitsClient = await oneDriveForBusinessProtectionPoliciesClient.driveProtectionUnits(oneDriveForBusinessProtectionPolicyId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List driveProtectionUnits | `GET /solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}/driveProtectionUnits` | `await driveProtectionUnitsClient.list(params);` |
| Get driveProtectionUnits from solutions | `GET /solutions/backupRestore/oneDriveForBusinessProtectionPolicies/{oneDriveForBusinessProtectionPolicy-id}/driveProtectionUnits/{driveProtectionUnit-id}` | `await driveProtectionUnitsClient.get({"driveProtectionUnit-id": driveProtectionUnitId  });` |

## OneDriveForBusinessRestoreSessionsClient Endpoints

The OneDriveForBusinessRestoreSessionsClient instance gives access to the following `/solutions/backupRestore/oneDriveForBusinessRestoreSessions` endpoints. You can get a `OneDriveForBusinessRestoreSessionsClient` instance like so:

```typescript
const oneDriveForBusinessRestoreSessionsClient = backupRestoreClient.oneDriveForBusinessRestoreSessions;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get oneDriveForBusinessRestoreSessions from solutions | `GET /solutions/backupRestore/oneDriveForBusinessRestoreSessions` | `await oneDriveForBusinessRestoreSessionsClient.list(params);` |
| Create new navigation property to oneDriveForBusinessRestoreSessions for solutions | `POST /solutions/backupRestore/oneDriveForBusinessRestoreSessions` | `await oneDriveForBusinessRestoreSessionsClient.create(params);` |
| Get oneDriveForBusinessRestoreSessions from solutions | `GET /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}` | `await oneDriveForBusinessRestoreSessionsClient.get({"oneDriveForBusinessRestoreSession-id": oneDriveForBusinessRestoreSessionId  });` |
| Delete navigation property oneDriveForBusinessRestoreSessions for solutions | `DELETE /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}` | `await oneDriveForBusinessRestoreSessionsClient.delete({"oneDriveForBusinessRestoreSession-id": oneDriveForBusinessRestoreSessionId  });` |
| Update oneDriveForBusinessRestoreSession | `PATCH /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}` | `await oneDriveForBusinessRestoreSessionsClient.update(params);` |

## DriveRestoreArtifactsClient Endpoints

The DriveRestoreArtifactsClient instance gives access to the following `/solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts` endpoints. You can get a `DriveRestoreArtifactsClient` instance like so:

```typescript
const driveRestoreArtifactsClient = await oneDriveForBusinessRestoreSessionsClient.driveRestoreArtifacts(oneDriveForBusinessRestoreSessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List driveRestoreArtifacts | `GET /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts` | `await driveRestoreArtifactsClient.list(params);` |
| Create new navigation property to driveRestoreArtifacts for solutions | `POST /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts` | `await driveRestoreArtifactsClient.create(params);` |
| Get driveRestoreArtifacts from solutions | `GET /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts/{driveRestoreArtifact-id}` | `await driveRestoreArtifactsClient.get({"driveRestoreArtifact-id": driveRestoreArtifactId  });` |
| Delete navigation property driveRestoreArtifacts for solutions | `DELETE /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts/{driveRestoreArtifact-id}` | `await driveRestoreArtifactsClient.delete({"driveRestoreArtifact-id": driveRestoreArtifactId  });` |
| Update the navigation property driveRestoreArtifacts in solutions | `PATCH /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts/{driveRestoreArtifact-id}` | `await driveRestoreArtifactsClient.update(params);` |

## RestorePointClient Endpoints

The RestorePointClient instance gives access to the following `/solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts/{driveRestoreArtifact-id}/restorePoint` endpoints. You can get a `RestorePointClient` instance like so:

```typescript
const restorePointClient = await driveRestoreArtifactsClient.restorePoint(driveRestoreArtifactId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get restorePoint from solutions | `GET /solutions/backupRestore/oneDriveForBusinessRestoreSessions/{oneDriveForBusinessRestoreSession-id}/driveRestoreArtifacts/{driveRestoreArtifact-id}/restorePoint` | `await restorePointClient.list(params);` |

## ProtectionPoliciesClient Endpoints

The ProtectionPoliciesClient instance gives access to the following `/solutions/backupRestore/protectionPolicies` endpoints. You can get a `ProtectionPoliciesClient` instance like so:

```typescript
const protectionPoliciesClient = backupRestoreClient.protectionPolicies;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get protectionPolicies from solutions | `GET /solutions/backupRestore/protectionPolicies` | `await protectionPoliciesClient.list(params);` |
| Create new navigation property to protectionPolicies for solutions | `POST /solutions/backupRestore/protectionPolicies` | `await protectionPoliciesClient.create(params);` |
| Get protectionPolicies from solutions | `GET /solutions/backupRestore/protectionPolicies/{protectionPolicyBase-id}` | `await protectionPoliciesClient.get({"protectionPolicyBase-id": protectionPolicyBaseId  });` |
| Delete protectionPolicyBase | `DELETE /solutions/backupRestore/protectionPolicies/{protectionPolicyBase-id}` | `await protectionPoliciesClient.delete({"protectionPolicyBase-id": protectionPolicyBaseId  });` |
| Update the navigation property protectionPolicies in solutions | `PATCH /solutions/backupRestore/protectionPolicies/{protectionPolicyBase-id}` | `await protectionPoliciesClient.update(params);` |

## ActivateClient Endpoints

The ActivateClient instance gives access to the following `/solutions/backupRestore/protectionPolicies/{protectionPolicyBase-id}/activate` endpoints. You can get a `ActivateClient` instance like so:

```typescript
const activateClient = await protectionPoliciesClient.activate(protectionPolicyBaseId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action activate | `POST /solutions/backupRestore/protectionPolicies/{protectionPolicyBase-id}/activate` | `await activateClient.create(params);` |

## DeactivateClient Endpoints

The DeactivateClient instance gives access to the following `/solutions/backupRestore/protectionPolicies/{protectionPolicyBase-id}/deactivate` endpoints. You can get a `DeactivateClient` instance like so:

```typescript
const deactivateClient = await protectionPoliciesClient.deactivate(protectionPolicyBaseId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action deactivate | `POST /solutions/backupRestore/protectionPolicies/{protectionPolicyBase-id}/deactivate` | `await deactivateClient.create(params);` |

## ProtectionUnitsClient Endpoints

The ProtectionUnitsClient instance gives access to the following `/solutions/backupRestore/protectionUnits` endpoints. You can get a `ProtectionUnitsClient` instance like so:

```typescript
const protectionUnitsClient = backupRestoreClient.protectionUnits;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get protectionUnitBase | `GET /solutions/backupRestore/protectionUnits` | `await protectionUnitsClient.list(params);` |
| Get protectionUnitBase | `GET /solutions/backupRestore/protectionUnits/{protectionUnitBase-id}` | `await protectionUnitsClient.get({"protectionUnitBase-id": protectionUnitBaseId  });` |

## RestorePointsClient Endpoints

The RestorePointsClient instance gives access to the following `/solutions/backupRestore/restorePoints` endpoints. You can get a `RestorePointsClient` instance like so:

```typescript
const restorePointsClient = backupRestoreClient.restorePoints;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get restorePoints from solutions | `GET /solutions/backupRestore/restorePoints` | `await restorePointsClient.list(params);` |
| Create new navigation property to restorePoints for solutions | `POST /solutions/backupRestore/restorePoints` | `await restorePointsClient.create(params);` |
| Get restorePoints from solutions | `GET /solutions/backupRestore/restorePoints/{restorePoint-id}` | `await restorePointsClient.get({"restorePoint-id": restorePointId  });` |
| Delete navigation property restorePoints for solutions | `DELETE /solutions/backupRestore/restorePoints/{restorePoint-id}` | `await restorePointsClient.delete({"restorePoint-id": restorePointId  });` |
| Update the navigation property restorePoints in solutions | `PATCH /solutions/backupRestore/restorePoints/{restorePoint-id}` | `await restorePointsClient.update(params);` |

## ProtectionUnitClient Endpoints

The ProtectionUnitClient instance gives access to the following `/solutions/backupRestore/restorePoints/{restorePoint-id}/protectionUnit` endpoints. You can get a `ProtectionUnitClient` instance like so:

```typescript
const protectionUnitClient = await restorePointsClient.protectionUnit(restorePointId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get protectionUnit from solutions | `GET /solutions/backupRestore/restorePoints/{restorePoint-id}/protectionUnit` | `await protectionUnitClient.list(params);` |

## SearchClient Endpoints

The SearchClient instance gives access to the following `/solutions/backupRestore/restorePoints/search` endpoints. You can get a `SearchClient` instance like so:

```typescript
const searchClient = restorePointsClient.search;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action search | `POST /solutions/backupRestore/restorePoints/search` | `await searchClient.create(params);` |

## RestoreSessionsClient Endpoints

The RestoreSessionsClient instance gives access to the following `/solutions/backupRestore/restoreSessions` endpoints. You can get a `RestoreSessionsClient` instance like so:

```typescript
const restoreSessionsClient = backupRestoreClient.restoreSessions;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List restoreSessionBase objects | `GET /solutions/backupRestore/restoreSessions` | `await restoreSessionsClient.list(params);` |
| Create new navigation property to restoreSessions for solutions | `POST /solutions/backupRestore/restoreSessions` | `await restoreSessionsClient.create(params);` |
| Get restoreSessionBase | `GET /solutions/backupRestore/restoreSessions/{restoreSessionBase-id}` | `await restoreSessionsClient.get({"restoreSessionBase-id": restoreSessionBaseId  });` |
| Delete restoreSessionBase | `DELETE /solutions/backupRestore/restoreSessions/{restoreSessionBase-id}` | `await restoreSessionsClient.delete({"restoreSessionBase-id": restoreSessionBaseId  });` |
| Update the navigation property restoreSessions in solutions | `PATCH /solutions/backupRestore/restoreSessions/{restoreSessionBase-id}` | `await restoreSessionsClient.update(params);` |

## ActivateClient Endpoints

The ActivateClient instance gives access to the following `/solutions/backupRestore/restoreSessions/{restoreSessionBase-id}/activate` endpoints. You can get a `ActivateClient` instance like so:

```typescript
const activateClient = await restoreSessionsClient.activate(restoreSessionBaseId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action activate | `POST /solutions/backupRestore/restoreSessions/{restoreSessionBase-id}/activate` | `await activateClient.create(params);` |

## ServiceAppsClient Endpoints

The ServiceAppsClient instance gives access to the following `/solutions/backupRestore/serviceApps` endpoints. You can get a `ServiceAppsClient` instance like so:

```typescript
const serviceAppsClient = backupRestoreClient.serviceApps;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List serviceApps | `GET /solutions/backupRestore/serviceApps` | `await serviceAppsClient.list(params);` |
| Create serviceApp | `POST /solutions/backupRestore/serviceApps` | `await serviceAppsClient.create(params);` |
| Get serviceApp | `GET /solutions/backupRestore/serviceApps/{serviceApp-id}` | `await serviceAppsClient.get({"serviceApp-id": serviceAppId  });` |
| Delete serviceApp | `DELETE /solutions/backupRestore/serviceApps/{serviceApp-id}` | `await serviceAppsClient.delete({"serviceApp-id": serviceAppId  });` |
| Update the navigation property serviceApps in solutions | `PATCH /solutions/backupRestore/serviceApps/{serviceApp-id}` | `await serviceAppsClient.update(params);` |

## ActivateClient Endpoints

The ActivateClient instance gives access to the following `/solutions/backupRestore/serviceApps/{serviceApp-id}/activate` endpoints. You can get a `ActivateClient` instance like so:

```typescript
const activateClient = await serviceAppsClient.activate(serviceAppId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action activate | `POST /solutions/backupRestore/serviceApps/{serviceApp-id}/activate` | `await activateClient.create(params);` |

## DeactivateClient Endpoints

The DeactivateClient instance gives access to the following `/solutions/backupRestore/serviceApps/{serviceApp-id}/deactivate` endpoints. You can get a `DeactivateClient` instance like so:

```typescript
const deactivateClient = await serviceAppsClient.deactivate(serviceAppId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action deactivate | `POST /solutions/backupRestore/serviceApps/{serviceApp-id}/deactivate` | `await deactivateClient.create(params);` |

## SharePointProtectionPoliciesClient Endpoints

The SharePointProtectionPoliciesClient instance gives access to the following `/solutions/backupRestore/sharePointProtectionPolicies` endpoints. You can get a `SharePointProtectionPoliciesClient` instance like so:

```typescript
const sharePointProtectionPoliciesClient = backupRestoreClient.sharePointProtectionPolicies;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sharePointProtectionPolicies from solutions | `GET /solutions/backupRestore/sharePointProtectionPolicies` | `await sharePointProtectionPoliciesClient.list(params);` |
| Create sharePointProtectionPolicy | `POST /solutions/backupRestore/sharePointProtectionPolicies` | `await sharePointProtectionPoliciesClient.create(params);` |
| Get sharePointProtectionPolicies from solutions | `GET /solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}` | `await sharePointProtectionPoliciesClient.get({"sharePointProtectionPolicy-id": sharePointProtectionPolicyId  });` |
| Delete navigation property sharePointProtectionPolicies for solutions | `DELETE /solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}` | `await sharePointProtectionPoliciesClient.delete({"sharePointProtectionPolicy-id": sharePointProtectionPolicyId  });` |
| Update sharePointProtectionPolicy | `PATCH /solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}` | `await sharePointProtectionPoliciesClient.update(params);` |

## SiteInclusionRulesClient Endpoints

The SiteInclusionRulesClient instance gives access to the following `/solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}/siteInclusionRules` endpoints. You can get a `SiteInclusionRulesClient` instance like so:

```typescript
const siteInclusionRulesClient = await sharePointProtectionPoliciesClient.siteInclusionRules(sharePointProtectionPolicyId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List siteInclusionRules | `GET /solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}/siteInclusionRules` | `await siteInclusionRulesClient.list(params);` |
| Get protectionRuleBase | `GET /solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}/siteInclusionRules/{siteProtectionRule-id}` | `await siteInclusionRulesClient.get({"siteProtectionRule-id": siteProtectionRuleId  });` |

## SiteProtectionUnitsClient Endpoints

The SiteProtectionUnitsClient instance gives access to the following `/solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}/siteProtectionUnits` endpoints. You can get a `SiteProtectionUnitsClient` instance like so:

```typescript
const siteProtectionUnitsClient = await sharePointProtectionPoliciesClient.siteProtectionUnits(sharePointProtectionPolicyId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List siteProtectionUnits | `GET /solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}/siteProtectionUnits` | `await siteProtectionUnitsClient.list(params);` |
| Get siteProtectionUnits from solutions | `GET /solutions/backupRestore/sharePointProtectionPolicies/{sharePointProtectionPolicy-id}/siteProtectionUnits/{siteProtectionUnit-id}` | `await siteProtectionUnitsClient.get({"siteProtectionUnit-id": siteProtectionUnitId  });` |

## SharePointRestoreSessionsClient Endpoints

The SharePointRestoreSessionsClient instance gives access to the following `/solutions/backupRestore/sharePointRestoreSessions` endpoints. You can get a `SharePointRestoreSessionsClient` instance like so:

```typescript
const sharePointRestoreSessionsClient = backupRestoreClient.sharePointRestoreSessions;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sharePointRestoreSessions from solutions | `GET /solutions/backupRestore/sharePointRestoreSessions` | `await sharePointRestoreSessionsClient.list(params);` |
| Create sharePointRestoreSession | `POST /solutions/backupRestore/sharePointRestoreSessions` | `await sharePointRestoreSessionsClient.create(params);` |
| Get sharePointRestoreSessions from solutions | `GET /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}` | `await sharePointRestoreSessionsClient.get({"sharePointRestoreSession-id": sharePointRestoreSessionId  });` |
| Delete navigation property sharePointRestoreSessions for solutions | `DELETE /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}` | `await sharePointRestoreSessionsClient.delete({"sharePointRestoreSession-id": sharePointRestoreSessionId  });` |
| Update the navigation property sharePointRestoreSessions in solutions | `PATCH /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}` | `await sharePointRestoreSessionsClient.update(params);` |

## SiteRestoreArtifactsClient Endpoints

The SiteRestoreArtifactsClient instance gives access to the following `/solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts` endpoints. You can get a `SiteRestoreArtifactsClient` instance like so:

```typescript
const siteRestoreArtifactsClient = await sharePointRestoreSessionsClient.siteRestoreArtifacts(sharePointRestoreSessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List siteRestoreArtifacts | `GET /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts` | `await siteRestoreArtifactsClient.list(params);` |
| Create new navigation property to siteRestoreArtifacts for solutions | `POST /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts` | `await siteRestoreArtifactsClient.create(params);` |
| Get siteRestoreArtifacts from solutions | `GET /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts/{siteRestoreArtifact-id}` | `await siteRestoreArtifactsClient.get({"siteRestoreArtifact-id": siteRestoreArtifactId  });` |
| Delete navigation property siteRestoreArtifacts for solutions | `DELETE /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts/{siteRestoreArtifact-id}` | `await siteRestoreArtifactsClient.delete({"siteRestoreArtifact-id": siteRestoreArtifactId  });` |
| Update the navigation property siteRestoreArtifacts in solutions | `PATCH /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts/{siteRestoreArtifact-id}` | `await siteRestoreArtifactsClient.update(params);` |

## RestorePointClient Endpoints

The RestorePointClient instance gives access to the following `/solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts/{siteRestoreArtifact-id}/restorePoint` endpoints. You can get a `RestorePointClient` instance like so:

```typescript
const restorePointClient = await siteRestoreArtifactsClient.restorePoint(siteRestoreArtifactId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get restorePoint from solutions | `GET /solutions/backupRestore/sharePointRestoreSessions/{sharePointRestoreSession-id}/siteRestoreArtifacts/{siteRestoreArtifact-id}/restorePoint` | `await restorePointClient.list(params);` |

## SiteInclusionRulesClient Endpoints

The SiteInclusionRulesClient instance gives access to the following `/solutions/backupRestore/siteInclusionRules` endpoints. You can get a `SiteInclusionRulesClient` instance like so:

```typescript
const siteInclusionRulesClient = backupRestoreClient.siteInclusionRules;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get siteInclusionRules from solutions | `GET /solutions/backupRestore/siteInclusionRules` | `await siteInclusionRulesClient.list(params);` |
| Create new navigation property to siteInclusionRules for solutions | `POST /solutions/backupRestore/siteInclusionRules` | `await siteInclusionRulesClient.create(params);` |
| Get siteInclusionRules from solutions | `GET /solutions/backupRestore/siteInclusionRules/{siteProtectionRule-id}` | `await siteInclusionRulesClient.get({"siteProtectionRule-id": siteProtectionRuleId  });` |
| Delete navigation property siteInclusionRules for solutions | `DELETE /solutions/backupRestore/siteInclusionRules/{siteProtectionRule-id}` | `await siteInclusionRulesClient.delete({"siteProtectionRule-id": siteProtectionRuleId  });` |
| Update the navigation property siteInclusionRules in solutions | `PATCH /solutions/backupRestore/siteInclusionRules/{siteProtectionRule-id}` | `await siteInclusionRulesClient.update(params);` |

## SiteProtectionUnitsClient Endpoints

The SiteProtectionUnitsClient instance gives access to the following `/solutions/backupRestore/siteProtectionUnits` endpoints. You can get a `SiteProtectionUnitsClient` instance like so:

```typescript
const siteProtectionUnitsClient = backupRestoreClient.siteProtectionUnits;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get siteProtectionUnits from solutions | `GET /solutions/backupRestore/siteProtectionUnits` | `await siteProtectionUnitsClient.list(params);` |
| Create new navigation property to siteProtectionUnits for solutions | `POST /solutions/backupRestore/siteProtectionUnits` | `await siteProtectionUnitsClient.create(params);` |
| Get siteProtectionUnits from solutions | `GET /solutions/backupRestore/siteProtectionUnits/{siteProtectionUnit-id}` | `await siteProtectionUnitsClient.get({"siteProtectionUnit-id": siteProtectionUnitId  });` |
| Delete navigation property siteProtectionUnits for solutions | `DELETE /solutions/backupRestore/siteProtectionUnits/{siteProtectionUnit-id}` | `await siteProtectionUnitsClient.delete({"siteProtectionUnit-id": siteProtectionUnitId  });` |
| Update the navigation property siteProtectionUnits in solutions | `PATCH /solutions/backupRestore/siteProtectionUnits/{siteProtectionUnit-id}` | `await siteProtectionUnitsClient.update(params);` |

## BookingBusinessesClient Endpoints

The BookingBusinessesClient instance gives access to the following `/solutions/bookingBusinesses` endpoints. You can get a `BookingBusinessesClient` instance like so:

```typescript
const bookingBusinessesClient = solutionsClient.bookingBusinesses;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List bookingBusinesses | `GET /solutions/bookingBusinesses` | `await bookingBusinessesClient.list(params);` |
| Create bookingBusiness | `POST /solutions/bookingBusinesses` | `await bookingBusinessesClient.create(params);` |
| Get bookingBusiness | `GET /solutions/bookingBusinesses/{bookingBusiness-id}` | `await bookingBusinessesClient.get({"bookingBusiness-id": bookingBusinessId  });` |
| Delete bookingBusiness | `DELETE /solutions/bookingBusinesses/{bookingBusiness-id}` | `await bookingBusinessesClient.delete({"bookingBusiness-id": bookingBusinessId  });` |
| Update bookingbusiness | `PATCH /solutions/bookingBusinesses/{bookingBusiness-id}` | `await bookingBusinessesClient.update(params);` |

## AppointmentsClient Endpoints

The AppointmentsClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/appointments` endpoints. You can get a `AppointmentsClient` instance like so:

```typescript
const appointmentsClient = await bookingBusinessesClient.appointments(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List appointments | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/appointments` | `await appointmentsClient.list(params);` |
| Create bookingAppointment | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/appointments` | `await appointmentsClient.create(params);` |
| Get bookingAppointment | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/appointments/{bookingAppointment-id}` | `await appointmentsClient.get({"bookingAppointment-id": bookingAppointmentId  });` |
| Delete bookingAppointment | `DELETE /solutions/bookingBusinesses/{bookingBusiness-id}/appointments/{bookingAppointment-id}` | `await appointmentsClient.delete({"bookingAppointment-id": bookingAppointmentId  });` |
| Update bookingAppointment | `PATCH /solutions/bookingBusinesses/{bookingBusiness-id}/appointments/{bookingAppointment-id}` | `await appointmentsClient.update(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/appointments/{bookingAppointment-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await appointmentsClient.cancel(bookingAppointmentId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/appointments/{bookingAppointment-id}/cancel` | `await cancelClient.create(params);` |

## CalendarViewClient Endpoints

The CalendarViewClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/calendarView` endpoints. You can get a `CalendarViewClient` instance like so:

```typescript
const calendarViewClient = await bookingBusinessesClient.calendarView(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List business calendarView | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/calendarView` | `await calendarViewClient.list(params);` |
| Create new navigation property to calendarView for solutions | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/calendarView` | `await calendarViewClient.create(params);` |
| Get calendarView from solutions | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/calendarView/{bookingAppointment-id}` | `await calendarViewClient.get({"bookingAppointment-id": bookingAppointmentId  });` |
| Delete navigation property calendarView for solutions | `DELETE /solutions/bookingBusinesses/{bookingBusiness-id}/calendarView/{bookingAppointment-id}` | `await calendarViewClient.delete({"bookingAppointment-id": bookingAppointmentId  });` |
| Update the navigation property calendarView in solutions | `PATCH /solutions/bookingBusinesses/{bookingBusiness-id}/calendarView/{bookingAppointment-id}` | `await calendarViewClient.update(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/calendarView/{bookingAppointment-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await calendarViewClient.cancel(bookingAppointmentId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/calendarView/{bookingAppointment-id}/cancel` | `await cancelClient.create(params);` |

## CustomersClient Endpoints

The CustomersClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/customers` endpoints. You can get a `CustomersClient` instance like so:

```typescript
const customersClient = await bookingBusinessesClient.customers(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List customers | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/customers` | `await customersClient.list(params);` |
| Create bookingCustomer | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/customers` | `await customersClient.create(params);` |
| Get bookingCustomer | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/customers/{bookingCustomerBase-id}` | `await customersClient.get({"bookingCustomerBase-id": bookingCustomerBaseId  });` |
| Delete bookingCustomer | `DELETE /solutions/bookingBusinesses/{bookingBusiness-id}/customers/{bookingCustomerBase-id}` | `await customersClient.delete({"bookingCustomerBase-id": bookingCustomerBaseId  });` |
| Update bookingCustomer | `PATCH /solutions/bookingBusinesses/{bookingBusiness-id}/customers/{bookingCustomerBase-id}` | `await customersClient.update(params);` |

## CustomQuestionsClient Endpoints

The CustomQuestionsClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/customQuestions` endpoints. You can get a `CustomQuestionsClient` instance like so:

```typescript
const customQuestionsClient = await bookingBusinessesClient.customQuestions(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List customQuestions | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/customQuestions` | `await customQuestionsClient.list(params);` |
| Create bookingCustomQuestion | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/customQuestions` | `await customQuestionsClient.create(params);` |
| Get bookingCustomQuestion | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/customQuestions/{bookingCustomQuestion-id}` | `await customQuestionsClient.get({"bookingCustomQuestion-id": bookingCustomQuestionId  });` |
| Delete bookingCustomQuestion | `DELETE /solutions/bookingBusinesses/{bookingBusiness-id}/customQuestions/{bookingCustomQuestion-id}` | `await customQuestionsClient.delete({"bookingCustomQuestion-id": bookingCustomQuestionId  });` |
| Update bookingCustomQuestion | `PATCH /solutions/bookingBusinesses/{bookingBusiness-id}/customQuestions/{bookingCustomQuestion-id}` | `await customQuestionsClient.update(params);` |

## GetStaffAvailabilityClient Endpoints

The GetStaffAvailabilityClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/getStaffAvailability` endpoints. You can get a `GetStaffAvailabilityClient` instance like so:

```typescript
const getStaffAvailabilityClient = await bookingBusinessesClient.getStaffAvailability(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action getStaffAvailability | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/getStaffAvailability` | `await getStaffAvailabilityClient.create(params);` |

## PublishClient Endpoints

The PublishClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/publish` endpoints. You can get a `PublishClient` instance like so:

```typescript
const publishClient = await bookingBusinessesClient.publish(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action publish | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/publish` | `await publishClient.create(params);` |

## UnpublishClient Endpoints

The UnpublishClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/unpublish` endpoints. You can get a `UnpublishClient` instance like so:

```typescript
const unpublishClient = await bookingBusinessesClient.unpublish(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action unpublish | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/unpublish` | `await unpublishClient.create(params);` |

## ServicesClient Endpoints

The ServicesClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/services` endpoints. You can get a `ServicesClient` instance like so:

```typescript
const servicesClient = await bookingBusinessesClient.services(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List services | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/services` | `await servicesClient.list(params);` |
| Create bookingService | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/services` | `await servicesClient.create(params);` |
| Get bookingService | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/services/{bookingService-id}` | `await servicesClient.get({"bookingService-id": bookingServiceId  });` |
| Delete bookingService | `DELETE /solutions/bookingBusinesses/{bookingBusiness-id}/services/{bookingService-id}` | `await servicesClient.delete({"bookingService-id": bookingServiceId  });` |
| Update bookingservice | `PATCH /solutions/bookingBusinesses/{bookingBusiness-id}/services/{bookingService-id}` | `await servicesClient.update(params);` |

## StaffMembersClient Endpoints

The StaffMembersClient instance gives access to the following `/solutions/bookingBusinesses/{bookingBusiness-id}/staffMembers` endpoints. You can get a `StaffMembersClient` instance like so:

```typescript
const staffMembersClient = await bookingBusinessesClient.staffMembers(bookingBusinessId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List staffMembers | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/staffMembers` | `await staffMembersClient.list(params);` |
| Create bookingStaffMember | `POST /solutions/bookingBusinesses/{bookingBusiness-id}/staffMembers` | `await staffMembersClient.create(params);` |
| Get bookingStaffMember | `GET /solutions/bookingBusinesses/{bookingBusiness-id}/staffMembers/{bookingStaffMemberBase-id}` | `await staffMembersClient.get({"bookingStaffMemberBase-id": bookingStaffMemberBaseId  });` |
| Delete bookingStaffMember | `DELETE /solutions/bookingBusinesses/{bookingBusiness-id}/staffMembers/{bookingStaffMemberBase-id}` | `await staffMembersClient.delete({"bookingStaffMemberBase-id": bookingStaffMemberBaseId  });` |
| Update bookingstaffmember | `PATCH /solutions/bookingBusinesses/{bookingBusiness-id}/staffMembers/{bookingStaffMemberBase-id}` | `await staffMembersClient.update(params);` |

## BookingCurrenciesClient Endpoints

The BookingCurrenciesClient instance gives access to the following `/solutions/bookingCurrencies` endpoints. You can get a `BookingCurrenciesClient` instance like so:

```typescript
const bookingCurrenciesClient = solutionsClient.bookingCurrencies;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List bookingCurrencies | `GET /solutions/bookingCurrencies` | `await bookingCurrenciesClient.list(params);` |
| Create new navigation property to bookingCurrencies for solutions | `POST /solutions/bookingCurrencies` | `await bookingCurrenciesClient.create(params);` |
| Get bookingCurrency | `GET /solutions/bookingCurrencies/{bookingCurrency-id}` | `await bookingCurrenciesClient.get({"bookingCurrency-id": bookingCurrencyId  });` |
| Delete navigation property bookingCurrencies for solutions | `DELETE /solutions/bookingCurrencies/{bookingCurrency-id}` | `await bookingCurrenciesClient.delete({"bookingCurrency-id": bookingCurrencyId  });` |
| Update the navigation property bookingCurrencies in solutions | `PATCH /solutions/bookingCurrencies/{bookingCurrency-id}` | `await bookingCurrenciesClient.update(params);` |

## VirtualEventsClient Endpoints

The VirtualEventsClient instance gives access to the following `/solutions/virtualEvents` endpoints. You can get a `VirtualEventsClient` instance like so:

```typescript
const virtualEventsClient = solutionsClient.virtualEvents;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get virtualEvents from solutions | `GET /solutions/virtualEvents` | `await virtualEventsClient.list(params);` |
| Delete navigation property virtualEvents for solutions | `DELETE /solutions/virtualEvents` | `await virtualEventsClient.delete({"":   });` |
| Update the navigation property virtualEvents in solutions | `PATCH /solutions/virtualEvents` | `await virtualEventsClient.update(params);` |

## EventsClient Endpoints

The EventsClient instance gives access to the following `/solutions/virtualEvents/events` endpoints. You can get a `EventsClient` instance like so:

```typescript
const eventsClient = virtualEventsClient.events;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get events from solutions | `GET /solutions/virtualEvents/events` | `await eventsClient.list(params);` |
| Create new navigation property to events for solutions | `POST /solutions/virtualEvents/events` | `await eventsClient.create(params);` |
| Get events from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}` | `await eventsClient.get({"virtualEvent-id": virtualEventId  });` |
| Delete navigation property events for solutions | `DELETE /solutions/virtualEvents/events/{virtualEvent-id}` | `await eventsClient.delete({"virtualEvent-id": virtualEventId  });` |
| Update the navigation property events in solutions | `PATCH /solutions/virtualEvents/events/{virtualEvent-id}` | `await eventsClient.update(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/solutions/virtualEvents/events/{virtualEvent-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await eventsClient.cancel(virtualEventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /solutions/virtualEvents/events/{virtualEvent-id}/cancel` | `await cancelClient.create(params);` |

## PublishClient Endpoints

The PublishClient instance gives access to the following `/solutions/virtualEvents/events/{virtualEvent-id}/publish` endpoints. You can get a `PublishClient` instance like so:

```typescript
const publishClient = await eventsClient.publish(virtualEventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action publish | `POST /solutions/virtualEvents/events/{virtualEvent-id}/publish` | `await publishClient.create(params);` |

## SetExternalEventInformationClient Endpoints

The SetExternalEventInformationClient instance gives access to the following `/solutions/virtualEvents/events/{virtualEvent-id}/setExternalEventInformation` endpoints. You can get a `SetExternalEventInformationClient` instance like so:

```typescript
const setExternalEventInformationClient = await eventsClient.setExternalEventInformation(virtualEventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action setExternalEventInformation | `POST /solutions/virtualEvents/events/{virtualEvent-id}/setExternalEventInformation` | `await setExternalEventInformationClient.create(params);` |

## PresentersClient Endpoints

The PresentersClient instance gives access to the following `/solutions/virtualEvents/events/{virtualEvent-id}/presenters` endpoints. You can get a `PresentersClient` instance like so:

```typescript
const presentersClient = await eventsClient.presenters(virtualEventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get presenters from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/presenters` | `await presentersClient.list(params);` |
| Create new navigation property to presenters for solutions | `POST /solutions/virtualEvents/events/{virtualEvent-id}/presenters` | `await presentersClient.create(params);` |
| Get presenters from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.get({"virtualEventPresenter-id": virtualEventPresenterId  });` |
| Delete navigation property presenters for solutions | `DELETE /solutions/virtualEvents/events/{virtualEvent-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.delete({"virtualEventPresenter-id": virtualEventPresenterId  });` |
| Update the navigation property presenters in solutions | `PATCH /solutions/virtualEvents/events/{virtualEvent-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.update(params);` |

## SessionsClient Endpoints

The SessionsClient instance gives access to the following `/solutions/virtualEvents/events/{virtualEvent-id}/sessions` endpoints. You can get a `SessionsClient` instance like so:

```typescript
const sessionsClient = await eventsClient.sessions(virtualEventId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sessions from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/sessions` | `await sessionsClient.list(params);` |
| Create new navigation property to sessions for solutions | `POST /solutions/virtualEvents/events/{virtualEvent-id}/sessions` | `await sessionsClient.create(params);` |
| Get sessions from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.get({"virtualEventSession-id": virtualEventSessionId  });` |
| Delete navigation property sessions for solutions | `DELETE /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.delete({"virtualEventSession-id": virtualEventSessionId  });` |
| Update the navigation property sessions in solutions | `PATCH /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.update(params);` |

## AttendanceReportsClient Endpoints

The AttendanceReportsClient instance gives access to the following `/solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports` endpoints. You can get a `AttendanceReportsClient` instance like so:

```typescript
const attendanceReportsClient = await sessionsClient.attendanceReports(virtualEventSessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceReports from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports` | `await attendanceReportsClient.list(params);` |
| Create new navigation property to attendanceReports for solutions | `POST /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports` | `await attendanceReportsClient.create(params);` |
| Get attendanceReports from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.get({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Delete navigation property attendanceReports for solutions | `DELETE /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.delete({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Update the navigation property attendanceReports in solutions | `PATCH /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.update(params);` |

## AttendanceRecordsClient Endpoints

The AttendanceRecordsClient instance gives access to the following `/solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` endpoints. You can get a `AttendanceRecordsClient` instance like so:

```typescript
const attendanceRecordsClient = await attendanceReportsClient.attendanceRecords(meetingAttendanceReportId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceRecords from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.list(params);` |
| Create new navigation property to attendanceRecords for solutions | `POST /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.create(params);` |
| Get attendanceRecords from solutions | `GET /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.get({"attendanceRecord-id": attendanceRecordId  });` |
| Delete navigation property attendanceRecords for solutions | `DELETE /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.delete({"attendanceRecord-id": attendanceRecordId  });` |
| Update the navigation property attendanceRecords in solutions | `PATCH /solutions/virtualEvents/events/{virtualEvent-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.update(params);` |

## TownhallsClient Endpoints

The TownhallsClient instance gives access to the following `/solutions/virtualEvents/townhalls` endpoints. You can get a `TownhallsClient` instance like so:

```typescript
const townhallsClient = virtualEventsClient.townhalls;
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get virtualEventTownhall | `GET /solutions/virtualEvents/townhalls` | `await townhallsClient.list(params);` |
| Create virtualEventTownhall | `POST /solutions/virtualEvents/townhalls` | `await townhallsClient.create(params);` |
| Get virtualEventTownhall | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}` | `await townhallsClient.get({"virtualEventTownhall-id": virtualEventTownhallId  });` |
| Delete navigation property townhalls for solutions | `DELETE /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}` | `await townhallsClient.delete({"virtualEventTownhall-id": virtualEventTownhallId  });` |
| Update virtualEventTownhall | `PATCH /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}` | `await townhallsClient.update(params);` |

## PresentersClient Endpoints

The PresentersClient instance gives access to the following `/solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/presenters` endpoints. You can get a `PresentersClient` instance like so:

```typescript
const presentersClient = await townhallsClient.presenters(virtualEventTownhallId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List presenters | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/presenters` | `await presentersClient.list(params);` |
| Create virtualEventPresenter | `POST /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/presenters` | `await presentersClient.create(params);` |
| Get virtualEventPresenter | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.get({"virtualEventPresenter-id": virtualEventPresenterId  });` |
| Delete virtualEventPresenter | `DELETE /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.delete({"virtualEventPresenter-id": virtualEventPresenterId  });` |
| Update the navigation property presenters in solutions | `PATCH /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.update(params);` |

## SessionsClient Endpoints

The SessionsClient instance gives access to the following `/solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions` endpoints. You can get a `SessionsClient` instance like so:

```typescript
const sessionsClient = await townhallsClient.sessions(virtualEventTownhallId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get sessions from solutions | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions` | `await sessionsClient.list(params);` |
| Create new navigation property to sessions for solutions | `POST /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions` | `await sessionsClient.create(params);` |
| Get sessions from solutions | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.get({"virtualEventSession-id": virtualEventSessionId  });` |
| Delete navigation property sessions for solutions | `DELETE /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.delete({"virtualEventSession-id": virtualEventSessionId  });` |
| Update the navigation property sessions in solutions | `PATCH /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.update(params);` |

## AttendanceReportsClient Endpoints

The AttendanceReportsClient instance gives access to the following `/solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports` endpoints. You can get a `AttendanceReportsClient` instance like so:

```typescript
const attendanceReportsClient = await sessionsClient.attendanceReports(virtualEventSessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceReports from solutions | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports` | `await attendanceReportsClient.list(params);` |
| Create new navigation property to attendanceReports for solutions | `POST /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports` | `await attendanceReportsClient.create(params);` |
| Get attendanceReports from solutions | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.get({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Delete navigation property attendanceReports for solutions | `DELETE /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.delete({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Update the navigation property attendanceReports in solutions | `PATCH /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.update(params);` |

## AttendanceRecordsClient Endpoints

The AttendanceRecordsClient instance gives access to the following `/solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` endpoints. You can get a `AttendanceRecordsClient` instance like so:

```typescript
const attendanceRecordsClient = await attendanceReportsClient.attendanceRecords(meetingAttendanceReportId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceRecords from solutions | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.list(params);` |
| Create new navigation property to attendanceRecords for solutions | `POST /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.create(params);` |
| Get attendanceRecords from solutions | `GET /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.get({"attendanceRecord-id": attendanceRecordId  });` |
| Delete navigation property attendanceRecords for solutions | `DELETE /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.delete({"attendanceRecord-id": attendanceRecordId  });` |
| Update the navigation property attendanceRecords in solutions | `PATCH /solutions/virtualEvents/townhalls/{virtualEventTownhall-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.update(params);` |

## WebinarsClient Endpoints

The WebinarsClient instance gives access to the following `/solutions/virtualEvents/webinars` endpoints. You can get a `WebinarsClient` instance like so:

```typescript
const webinarsClient = virtualEventsClient.webinars;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List webinars | `GET /solutions/virtualEvents/webinars` | `await webinarsClient.list(params);` |
| Create virtualEventWebinar | `POST /solutions/virtualEvents/webinars` | `await webinarsClient.create(params);` |
| Get virtualEventWebinar | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}` | `await webinarsClient.get({"virtualEventWebinar-id": virtualEventWebinarId  });` |
| Delete navigation property webinars for solutions | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}` | `await webinarsClient.delete({"virtualEventWebinar-id": virtualEventWebinarId  });` |
| Update virtualEventWebinar | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}` | `await webinarsClient.update(params);` |

## PresentersClient Endpoints

The PresentersClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/presenters` endpoints. You can get a `PresentersClient` instance like so:

```typescript
const presentersClient = await webinarsClient.presenters(virtualEventWebinarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get presenters from solutions | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/presenters` | `await presentersClient.list(params);` |
| Create virtualEventPresenter | `POST /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/presenters` | `await presentersClient.create(params);` |
| Get presenters from solutions | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.get({"virtualEventPresenter-id": virtualEventPresenterId  });` |
| Delete navigation property presenters for solutions | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.delete({"virtualEventPresenter-id": virtualEventPresenterId  });` |
| Update virtualEventPresenter | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/presenters/{virtualEventPresenter-id}` | `await presentersClient.update(params);` |

## RegistrationConfigurationClient Endpoints

The RegistrationConfigurationClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration` endpoints. You can get a `RegistrationConfigurationClient` instance like so:

```typescript
const registrationConfigurationClient = await webinarsClient.registrationConfiguration(virtualEventWebinarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get virtualEventWebinarRegistrationConfiguration | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration` | `await registrationConfigurationClient.list(params);` |
| Delete navigation property registrationConfiguration for solutions | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration` | `await registrationConfigurationClient.delete({"virtualEventWebinar-id": virtualEventWebinarId  });` |
| Update the navigation property registrationConfiguration in solutions | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration` | `await registrationConfigurationClient.update(params);` |

## QuestionsClient Endpoints

The QuestionsClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration/questions` endpoints. You can get a `QuestionsClient` instance like so:

```typescript
const questionsClient = registrationConfigurationClient.questions;
```
| Description | Endpoint | Usage | 
|--|--|--|
| List questions | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration/questions` | `await questionsClient.list(params);` |
| Create virtualEventRegistrationCustomQuestion | `POST /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration/questions` | `await questionsClient.create(params);` |
| Get questions from solutions | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration/questions/{virtualEventRegistrationQuestionBase-id}` | `await questionsClient.get({"virtualEventRegistrationQuestionBase-id": virtualEventRegistrationQuestionBaseId  });` |
| Delete virtualEventRegistrationQuestionBase | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration/questions/{virtualEventRegistrationQuestionBase-id}` | `await questionsClient.delete({"virtualEventRegistrationQuestionBase-id": virtualEventRegistrationQuestionBaseId  });` |
| Update the navigation property questions in solutions | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrationConfiguration/questions/{virtualEventRegistrationQuestionBase-id}` | `await questionsClient.update(params);` |

## RegistrationsClient Endpoints

The RegistrationsClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations` endpoints. You can get a `RegistrationsClient` instance like so:

```typescript
const registrationsClient = await webinarsClient.registrations(virtualEventWebinarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List virtualEventRegistrations | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations` | `await registrationsClient.list(params);` |
| Create virtualEventRegistration | `POST /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations` | `await registrationsClient.create(params);` |
| Get virtualEventRegistration | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}` | `await registrationsClient.get({"virtualEventRegistration-id": virtualEventRegistrationId  });` |
| Delete navigation property registrations for solutions | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}` | `await registrationsClient.delete({"virtualEventRegistration-id": virtualEventRegistrationId  });` |
| Update the navigation property registrations in solutions | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}` | `await registrationsClient.update(params);` |

## CancelClient Endpoints

The CancelClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}/cancel` endpoints. You can get a `CancelClient` instance like so:

```typescript
const cancelClient = await registrationsClient.cancel(virtualEventRegistrationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Invoke action cancel | `POST /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}/cancel` | `await cancelClient.create(params);` |

## SessionsClient Endpoints

The SessionsClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}/sessions` endpoints. You can get a `SessionsClient` instance like so:

```typescript
const sessionsClient = await registrationsClient.sessions(virtualEventRegistrationId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List sessions for a virtual event registration | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}/sessions` | `await sessionsClient.list(params);` |
| Get sessions from solutions | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/registrations/{virtualEventRegistration-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.get({"virtualEventSession-id": virtualEventSessionId  });` |

## SessionsClient Endpoints

The SessionsClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions` endpoints. You can get a `SessionsClient` instance like so:

```typescript
const sessionsClient = await webinarsClient.sessions(virtualEventWebinarId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List sessions for a virtual event | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions` | `await sessionsClient.list(params);` |
| Create new navigation property to sessions for solutions | `POST /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions` | `await sessionsClient.create(params);` |
| Get virtualEventSession | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.get({"virtualEventSession-id": virtualEventSessionId  });` |
| Delete navigation property sessions for solutions | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.delete({"virtualEventSession-id": virtualEventSessionId  });` |
| Update the navigation property sessions in solutions | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}` | `await sessionsClient.update(params);` |

## AttendanceReportsClient Endpoints

The AttendanceReportsClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports` endpoints. You can get a `AttendanceReportsClient` instance like so:

```typescript
const attendanceReportsClient = await sessionsClient.attendanceReports(virtualEventSessionId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| List meetingAttendanceReports | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports` | `await attendanceReportsClient.list(params);` |
| Create new navigation property to attendanceReports for solutions | `POST /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports` | `await attendanceReportsClient.create(params);` |
| Get meetingAttendanceReport | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.get({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Delete navigation property attendanceReports for solutions | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.delete({"meetingAttendanceReport-id": meetingAttendanceReportId  });` |
| Update the navigation property attendanceReports in solutions | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}` | `await attendanceReportsClient.update(params);` |

## AttendanceRecordsClient Endpoints

The AttendanceRecordsClient instance gives access to the following `/solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` endpoints. You can get a `AttendanceRecordsClient` instance like so:

```typescript
const attendanceRecordsClient = await attendanceReportsClient.attendanceRecords(meetingAttendanceReportId);
```
| Description | Endpoint | Usage | 
|--|--|--|
| Get attendanceRecords from solutions | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.list(params);` |
| Create new navigation property to attendanceRecords for solutions | `POST /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords` | `await attendanceRecordsClient.create(params);` |
| Get attendanceRecords from solutions | `GET /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.get({"attendanceRecord-id": attendanceRecordId  });` |
| Delete navigation property attendanceRecords for solutions | `DELETE /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.delete({"attendanceRecord-id": attendanceRecordId  });` |
| Update the navigation property attendanceRecords in solutions | `PATCH /solutions/virtualEvents/webinars/{virtualEventWebinar-id}/sessions/{virtualEventSession-id}/attendanceReports/{meetingAttendanceReport-id}/attendanceRecords/{attendanceRecord-id}` | `await attendanceRecordsClient.update(params);` |
