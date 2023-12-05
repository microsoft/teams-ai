# Teams SSO Bot

Teams SSO Bot sample for Teams.

This sample shows how to incorporate basic conversational flow with SSO into a Teams application. 
It also illustrates a few of the Teams specific calls you can make from your bot.

This sample depends on the Azure Bot Service and OAuth connection settings that you configure within it.

## Set up instructions

If you are using the Teams Toolkit to set up the bot (recommended) to set up this sample you need a valid Azure subscription and resource group.

1. Navigate to the `env/.env.local` file.
1. Add the azure subscription id to the `AZURE_SUBSCRIPTION_ID` variable.
1. Add the resource group name to the `AZURE_RESOURCE_GROUP_NAME` variable. The resource group should already exist in your Azure subscription.

The support of selecting Azure subscription and resource group during "Prepare Teams App Dependencies" will come with Visual Studio 17.9 release in the future. You can skip above steps when using Visual Studio 17.9 or higher.

Now you can follow the generic set up instructions here:
 [Setup Instructions](../README.md). 

## Interacting with the Bot

At this point you should have set up the bot and installed it in Teams. You can interact with the bot by sending it a message.

Here's a sample interaction with the bot:

![Flow 1](assets/flow-1.png)

You can click continue to go ahead with the SSO sign in flow. This will redirect you to a page where you have to sign in.

![Flow 2](assets/flow-2.png)

Then accept the permissions. If you successfully logged in then you should get this message.

![Flow 3](assets/flow-3.png)

You can also sign out by sending `/signout` to the bot.

## Deploy to Azure

You can use Teams Toolkit for Visual Studio or CLI to host the bot in Azure. The sample includes Bicep templates in the `/infra` directory which are used by the tools to create resources in Azure.

You can find deployment instructions [here](../README.md#deploy-to-azure).