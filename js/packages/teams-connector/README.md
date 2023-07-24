# Microsoft Bot Framework Connector for Node.js

Within the Bot Framework, the Bot Connector service enables your bot to exchange messages with users on channels that are configured in the Bot Framework Portal.

## Requirement
- Node.js version: 6.x.x or higher

## How to Install

```bash
npm install botframework-connector
```

## How to Use

### Authentication
Your bot communicates with the Bot Connector service using HTTP over a secured channel (SSL/TLS). When your bot sends a request to the Connector service, it must include information that the Connector service can use to verify its identity.

To authenticate the requests, you'll need configure the Connector with the App ID and password that you obtained for your bot during registration and the Connector will handle the rest.

More information: https://docs.microsoft.com/en-us/bot-framework/rest-api/bot-framework-rest-connector-authentication

### Example
Client creation (with authentication), conversation initialization and activity send to user.
````javascript
var { ConnectorClient, MicrosoftAppCredentials } = require('botframework-connector');

async function connectToSlack() {
    var credentials = new MicrosoftAppCredentials('<your-app-id>', '<your-app-password>');

    var botId = '<bot-id>';
    var recipientId = '<user-id>';

    var client = new ConnectorClient(credentials, { baseUri: 'https://slack.botframework.com' });

    var conversationResponse = await client.conversations.createConversation({
        bot: { id: botId },
        members: [
            { id: recipientId }
        ],
        isGroup: false
    });

    var activityResponse = await client.conversations.sendToConversation(conversationResponse.id, {
        type: 'message',
        from: { id: botId },
        recipient: { id: recipientId },
        text: 'This a message from Bot Connector Client (NodeJS)'
    });

    console.log('Sent reply with ActivityId:', activityResponse.id);
}
````

### Simple EchoBot Example ([source code](../../samples/echobot-simple-ts))
EchoBot is a minimal bot that receives message activities and replies with the same content.
The sample shows how to use restify/express for listening to activities and the ConnectorClient for sending activities.

## Rest API Documentation

For the Connector Service API Documentation, please see our [API reference](https://docs.microsoft.com/en-us/Bot-Framework/rest-api/bot-framework-rest-connector-api-reference).

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## License

Copyright (c) Microsoft Corporation. All rights reserved.

Licensed under the [MIT](https://github.com/Microsoft/vscode/blob/master/LICENSE.txt) License.
