#!/bin/bash
set -e

# Ensure Azure CLI is installed
if ! command -v az >/dev/null 2>&1; then
  echo "Error: Azure CLI ('az') is not installed. Install it from https://aka.ms/azcli and try again."
  exit 1
fi

# Ensure Azure CLI is logged in and has a subscription set
subscriptionId=$(az account show --query id -o tsv 2>/dev/null || true)
if [ -z "$subscriptionId" ]; then
  echo "Error: Azure CLI is not logged in or no subscription is set."
  echo "Run 'az login' to sign in, then 'az account set --subscription <id|name>' to set a subscription."
  exit 1
fi

# Prompt the user for the first three variables and ensure they are provided
read -r -p "Enter Azure resource group name: " resourceGroup
read -r -p "Enter Bot name: " botName
read -r -p "Enter endpoint URL (e.g. https://my.devtunnel.ms/api/messages): " endpointUrl

echo "Creating azure Bot Service with the following details:"
echo "Subscription ID: $subscriptionId"
echo "Resource Group: $resourceGroup"
echo "Bot Name: $botName"
echo "Endpoint URL: $endpointUrl"
echo " "
if [[ -z "$resourceGroup" || -z "$botName" || -z "$endpointUrl" ]]; then
    echo "Error: All variables must be provided."
    exit 1
fi

echo "Creating Entra ID app registration..."
appId=$(az ad app create --display-name $botName --sign-in-audience "AzureADMyOrg" --query appId -o tsv)
az ad sp create --id $appId
appCred=$(az ad app credential reset --id $appId)
tenantId=$(echo $appCred | jq -r '.tenant')
clientSecret=$(echo $appCred | jq -r '.password')
echo "App registration created with App ID: $appId"

echo "Creating Bot Service $botName in resource group $resourceGroup..."
az bot create \
   --name $botName \
   --app-type SingleTenant \
   --appid $appId \
   --tenant-id $tenantId \
   --resource-group $resourceGroup

az bot authsetting create \
  --resource-group $resourceGroup \
  --name $botName \
  -c "graph" \
  --client-id $appId \
  --client-secret $clientSecret \
  --provider-scope-string "User.Read" \
  --service "Aadv2" \
  --parameters "clientId=$appId" "clientSecret=$clientSecret" "tenantId=$tenantId" "tokenExchangeUrl=api://$appId"

az bot update \
   --name $botName \
   --resource-group $resourceGroup \
   --endpoint $endpointUrl

az bot msteams create \
    --name $botName \
    --resource-group $resourceGroup

echo "TENANT_ID=$tenantId" > "$botName.env"
echo "CLIENT_ID=$appId" >> "$botName.env"
echo "CLIENT_SECRET=$clientSecret" >> "$botName.env"

echo "Environment variables saved to $botName.env"