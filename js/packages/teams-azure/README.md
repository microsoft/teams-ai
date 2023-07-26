# Bot Builder Azure

Azure extensions for Microsoft BotBuilder.

- [Installing](#installing)
- [Basic Use](#use)
- [Documentation](https://docs.microsoft.com/en-us/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [Class Reference](https://docs.microsoft.com/en-us/javascript/api/botbuilder-azure/)
- [GitHub Repo](https://github.com/Microsoft/botbuilder-js)
- [Report Issues](https://github.com/Microsoft/botbuilder-js/issues)

## Installing
To add the latest version of this package to your bot:

```bash
npm install --save botbuilder-azure
```

#### Use the Daily Build

To get access to the daily builds of this library, configure npm to use the MyGet feed before installing.

```bash
npm config set registry https://botbuilder.myget.org/F/botbuilder-v4-js-daily/npm/
```

To reset the registry in order to get the latest published version, run:
```bash
npm config set registry https://registry.npmjs.org/
```

## What's Included

This module contains interfaces to use common Azure services to back Bot Builder's state storage.
When used with `UserState`, `ConversationState` and `BotState`, these storage interfaces will automatically
read and write values to the associated Azure service.

It currently supports Cosmos DB ([`CosmosDbPartitionedStorage()`](https://docs.microsoft.com/en-us/javascript/api/botbuilder-azure/cosmosdbpartitionedstorage)) and Azure Blob Storage ([`BlobStorage()`](https://docs.microsoft.com/en-us/javascript/api/botbuilder-azure/blobstorage)).

Also included is an interface to store and retrieve chat transcripts in blog storage called [AzureBlobTranscriptStore()](https://docs.microsoft.com/en-us/javascript/api/botbuilder-azure/azureblobtranscriptstore)

## Use

Import the module into your app.
```javascript
const { BlobStorage } = require('botbuilder-azure');
```

Configure the storage driver to work with your Azure resources.
```javascript
const blobStorage = new BlobStorage(options);
```

Pass the storage driver into your state managers:
```javascript
const userState = new UserState(blobStorage);
const conversationState = new ConverationState(blobStorage);
```
