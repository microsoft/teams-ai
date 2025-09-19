---
sidebar_position: 2
summary: Describe how to deploy the Azure Bot Service resource required for Teams bot apps
---

# Deployment

As described in the [Core Concepts](../core-concepts) article, the first step you need is an Azure Bot Service resource and associate it to an Entra ID App registration.

## Requirements

1. An Azure subscription
2. Permissions to create Entra ID App registrations. (If you don't have permissions in your tenant, ask your admin to create the App Registration and share the `Application Id`)
3. Permissions to create Azure Bot Service resources
4. (Optional) The [Azure CLI](https://aka.ms/azcli) installed and authenticated to your Azure subscription

### Create the Entra App Id registration

1. Navigate to the [Entra Id App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)
2. Select `New App Registration` and provide a name. Take note of the assigned `Application Id` (also known as `ClientId`) and `TenantId`
3. Navigate to `Certificates & secrets` and create `New client secret`

After a successful App Registration you should have the `TenantId`, `ClientId` and `ClientSecret` values, that you will need later.

#### Create the Entra App Id Registration using the Azure CLI

```bash
#!/bin/bash

botName="My App"
appId=$(az ad app create --display-name $botName --sign-in-audience "AzureADMyOrg" --query appId -o tsv)
az ad sp create --id $appId
appCred=$(az ad app credential reset --id $appId)
tenantId=$(echo $appCred | jq -r '.tenant')
clientSecret=$(echo $appCred | jq -r '.password')
```

### Create the Azure Bot Service resource

1. Create or select the resource group where you want to create the Azure Bot Resource
2. In the selected resource group, click Create and search for `bot`.
3. Select the option `Azure Bot`, and click `Create`
4. Provide the Bot handle, eg. `MyBot`, select Data Residency and Pricing tier
   1. Under Microsoft App ID, select `Single Tenant`
   2. In creation type select `Use existing app registration` and provide the `Application Id` obtained in the previous step


:::tip
You can create the Azure Bot Service resource and the Entra App Registration from this screen, and then you will have to create a new client secret.
:::

#### Create the Azure Bot Service resource using the Azure CLI

To run this script, make sure you initialize the variables `resourceGroup`, `tenantId` and `appId` from the previous steps.

```bash
#!/bin/bash

az bot create \
   --name $botName \
   --app-type SingleTenant \
   --appid $appId \
   --tenant-id $tenantId \
   --resource-group $resourceGroup
```

### Configure the Azure Bot Service resource

Once the Azure Bot Service resource has been created you can configure it

1. Under `Settings/Configuration` provide the Message endpoint URL, typically it will look like: `https://myapp.mydomain.com/api/messages`
   1. When using DevTunnels for local development, use the devtunnels hosting URL with the relative path `/api/messages`
   2. When deploying to a compute instance, such as App Services, Container Apps, or in other Cloud, use the public hostname with the relative path `/api/messages`
2. In `Settings/Channels` enable the `Microsoft Teams` channel.


#### Configure the Azure Bot Service resource using the Azure CLI

```bash
#!/bin/bash

endpointUrl=<your-devtunnels-public-url>
az bot update \
   --name $botName \
   --resource-group $resourceGroup \
   --endpoint $endpointUrl

az bot msteams create \
    --name $botName \
    --resource-group $resourceGroup 
```

## Save the credentials to use as configuration

```bash
#!/bin/bash

echo "TENANT_ID=$tenantId" > "$botName.env"
echo "CLIENT_ID=$appId" >> "$botName.env"
echo "CLIENT_SECRET=$clientSecret" >> "$botName.env"

```