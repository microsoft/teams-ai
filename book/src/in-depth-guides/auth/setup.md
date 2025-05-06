# App setup

There are a few ways you can enable your application to access secured external services on the user's behalf.

> [!Note]
> This is an advanced guide. It is highly recommended that you are familiar with [Teams Core Concepts](../../teams/core-concepts.md) before attempting this guide.


## Authenticate the user to Entra ID to access Microsoft Graph APIs
A very common use case is to access enterprise related information about the user, which can be done through Microsoft Graph's APIs. To do that the user will have to be authenticated to Entra ID. 

> [!note]
> See [How Auth Works](auth-sso.md) to learn more about how authentication works. 

### Manual setup

In this step you will have to tweak your Azure Bot service and App registration to add authentication configurations and enable Single Sign-On (SSO).

> [!Note]
> [Single Sign-On (SSO)](./auth-sso.md#single-sign-on-sso) within Teams is an authentication method that uses an app user's Teams identity to provide them with access to your app. A user who has logged into Teams doesn't need to log in again to your app within the Teams environment.

You can follow the [Enable SSO for bot and message extension app using Entra ID](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/bot-sso-register-aad?tabs=botid) guide in the Microsoft Learn docs.

### Using Teams Toolkit with the `teams` CLI

Open your terminal and navigate to the root folder of your app and run the following command:

<!-- langtabs-start -->
```sh
teams config add ttk.oauth
```
<!-- langtabs-end -->

The `ttk.oauth` configuration is a basic setup for Teams Toolkit along with configurations to authenticate the user with Microsoft Entra ID to access Microsoft Graph APIs.

This [CLI](../../developer-tools/cli/README.md) command adds configuration files required by Teams Toolkit, including:

- Azure Application Entra ID manifest file `aad.manifest.json`.
- Azure bicep files to provision Azure bot in `infra/` folder.

> [!Note]
> Teams toolkit, in the debugging flow, will deploy the `aad.manifest.json` and `infra/azure.local.bicep` file to provision the Application Entra ID and Azure bot with oauth configurations.


## Authenticate the user to third-party identity provider

You can follow the [Add authentication to bot app](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/add-authentication?tabs=dotnet%2Cdotnet-sample) Microsoft Learn guide.


## Resources

- [User Authentication Basics](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-authentication?view=azure-bot-service-4.0)
- [User Authentication in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/authentication)