# Teams Conversation Bot

Teams AI  Conversation Bot sample for Teams.

This sample shows how to incorporate basic conversational flow with SSO into a Teams application. 
It also illustrates a few of the Teams specific calls you can make from your bot.

This sample depends on Teams SSO and gives you more flexibility on how to configure AAD, like using a client certificate. There is no need to create an OAuth Connection in Azure Bot Service to run this sample.

## Set up instructions

All the samples in the C# .NET SDK can be set up in the same way: You can find the step by step instructions here:
 [Setup Instructions](../README.md).

## Interacting with the Bot

At this point you should have set up the bot and installed it in Teams. You can interact with the bot by sending it a message.

Here's a sample interaction with the bot:

![Sample interaction](assets/helloworld.png)

You can reset the message count by sending the bot the message `/reset`.

![Reset interaction](assets/reset.png)

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).