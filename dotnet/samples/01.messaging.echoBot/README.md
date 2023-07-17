# Teams Conversation Bot

Teams AI  Conversation Bot sample for Teams.

This sample shows how to incorporate basic conversational flow into a Teams application. 
It also illustrates a few of the Teams specific calls you can make from your bot.

## Set up instructions

All the samples in for the C# .NET SDK can be set up in the same way: You can find the step by step instructions here:
 [Setup Instructions](../README.md).

## Interacting with the Bot

At this point you should have set up the bot and installed it in Teams. You can interact with the bot by sending it a message.

Here's a sample interaction with the bot:

![Sample interaction](assets/helloworld.png)

You can reset the message count by sending the bot the message `/reset`.

![Reset interaction](assets/reset.png)

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

To configure the Azure resources to have an environment variable for the OpenAI Key:

Use the "Teams Toolkit" > "Provision in the Cloud...", "Teams Toolkit" > "Deploy to the Cloud" from project right-click menu, or from the CLI with `teamsfx provision` and `teamsfx deploy`. [Visit the documentation](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) for more info on hosting your app in Azure with Teams Toolkit.

Alternatively, you can learn more about deploying a bot to Azure manually in the [Deploy your bot to Azure](https://aka.ms/azuredeployment) documentation.

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://learn.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)