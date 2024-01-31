## Summary

This sample shows how to incorporate a basic Message Extension app into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK. Users can search nuget.org for packages.

## Set up instructions

All the samples in the C# .NET SDK can be set up in the same way. You can find the step by step instructions here:
 [Setup Instructions](../README.md).

## Interacting with the Message Extension

You can interact with this app by selecting its app icon in the chat compose area. This opens a dialog that allows you to search NuGet for a package. Selecting a package will output an Adaptive Card with its description to the chat.

Here's a sample search result:

![Sample search](assets/search.png)

And after selecting it outputs an Adaptive Card.

![Adaptive Card](assets/card.png)

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://learn.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)