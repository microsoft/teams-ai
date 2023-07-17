@maxLength(20)
@minLength(4)
@description('Used to generate names for all resources in this file')
param resourceBaseName string

@description('Required when create Azure Bot service')
param botAadAppClientId string

@secure()
@description('Required by Bot Framework package in your bot project')
param botAadAppClientSecret string

@secure()
@description('The OpenAI API Key to be added to App Service Settings')
param openAiApiKey string

@secure()
@description('The Azure OpenAI API Key to be added to App Service Settings')
param azureOpenAiApiKey string

@secure()
@description('The Azure OpenAI API Endpoint to be added to App Service Settings')
param azureOpenAiApiEndpoint string

@secure()
@description('The Azure Content Safety API Key to be added to App Service Settings')
param azureContentSafetyApiKey string

@secure()
@description('The Azure Content Safety API Endpoint to be added to App Service Settings')
param azureContentSafetyEndpoint string

param webAppSKU string

@maxLength(42)
param botDisplayName string

param serverfarmsName string = resourceBaseName
param webAppName string = resourceBaseName
param location string = resourceGroup().location

// Compute resources for your Web App
resource serverfarm 'Microsoft.Web/serverfarms@2021-02-01' = {
  kind: 'app'
  location: location
  name: serverfarmsName
  sku: {
    name: webAppSKU
  }
}

// Web App that hosts your bot
resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  kind: 'app'
  location: location
  name: webAppName
  properties: {
    serverFarmId: serverfarm.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1' // Run Azure APP Service from a package file
        }
        {
          name: 'BOT_ID'
          value: botAadAppClientId
        }
        {
          name: 'BOT_PASSWORD'
          value: botAadAppClientSecret
        }
        // ASP.NET Core treats double underscore (__) as colon (:) to support hierarchical keys
        {
          name: 'OpenAI__ApiKey'
          value: openAiApiKey
        }
        {
          name: 'Azure__OpenAIApiKey'
          value: azureOpenAiApiKey
        }
        {
          name: 'Azure__OpenAIEndpoint'
          value: azureOpenAiApiEndpoint
        }
        {
          name: 'Azure__ContentSafetyApiKey'
          value: azureContentSafetyApiKey
        }
        {
          name: 'Azure__ContentSafetyEndpoint'
          value: azureContentSafetyEndpoint
        }
      ]
      ftpsState: 'FtpsOnly'
    }
  }
}

// Register your web service as a bot with the Bot Framework
module azureBotRegistration './botRegistration/azurebot.bicep' = {
  name: 'Azure-Bot-registration'
  params: {
    resourceBaseName: resourceBaseName
    botAadAppClientId: botAadAppClientId
    botAppDomain: webApp.properties.defaultHostName
    botDisplayName: botDisplayName
  }
}

// The output will be persisted in .env.{envName}. Visit https://aka.ms/teamsfx-actions/arm-deploy for more details.
output BOT_AZURE_APP_SERVICE_RESOURCE_ID string = webApp.id
output BOT_DOMAIN string = webApp.properties.defaultHostName
