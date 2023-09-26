# Typeahead Bot

This sample shows how to incorporate the typeahead search functionality in Adaptive Cards into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK. Users can search nuget.org for packages.

## Set up instructions

All the samples in the C# .NET SDK can be set up in the same way. You can find the step by step instructions here: [Setup Instructions](../README.md).

## Interacting with the bot

![Typeahead search](./assets/TypeaheadSearch.png)

Send "static" to get the Adaptive Card with static typeahead search control and send "dynamic" to get the Adaptive Card with dynamic typeahead search control.

**static search**: Static typeahead search allows users to search from values specified within `Input.ChoiceSet` in the Adaptive Card payload.

**dynamic search**: Dynamic typeahead search is useful to search and select data from large data sets. The data sets are loaded dynamically from the `dataset` specified in the Adaptive Card payload.

On clicking "Submit" button, the bot will return the choices that have been selected.

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://learn.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)
