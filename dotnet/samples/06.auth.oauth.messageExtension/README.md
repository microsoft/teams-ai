# Teams Message Extension SSO

This sample shows how to incorporate a basic Message Extension app with SSO into a Microsoft Teams application using [Bot Framework](https://dev.botframework.com) and the Teams AI SDK. Users can search nuget.org for packages.

This sample depends on Teams SSO and gives you more flexibility on how to configure AAD, like using a client certificate. There is no need to create an OAuth Connection in Azure Bot Service to run this sample.

## Set up instructions

If you are using the Teams Toolkit to set up the bot (recommended) to set up this sample you need a valid Azure subscription and resource group.

1. Navigate to the `env/.env.local` file.
1. Add the azure subscription id to the `AZURE_SUBSCRIPTION_ID` variable.
1. Add the resource group name to the `AZURE_RESOURCE_GROUP_NAME` variable. The resource group should already exist in your Azure subscription.

The support of selecting Azure subscription and resource group during "Prepare Teams App Dependencies" will come with Visual Studio 17.9 release in the future. You can skip above steps when using Visual Studio 17.9 or higher.

Now you can follow the generic set up instructions here:
 [Setup Instructions](../README.md). 

## Interacting with the Message Extension

You can interact with this app by selecting its app icon in the chat compose area. This opens a dialog that allows you to search NuGet for a package. Selecting a package will output an Adaptive Card with its description to the chat.

If you type `profile` in the Message Extension's search box, it will show your profile in search result:
![screenshot](assets/screenshot.png)

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://learn.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)