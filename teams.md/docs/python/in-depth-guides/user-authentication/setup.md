---
sidebar_position: 3
summary: Guide to configuring user authentication in Python Teams AI applications, including OAuth setup and secure API access.
---

# App Setup

There are a few ways you can enable your application to access secured external services on the user's behalf.

:::note
This is an advanced guide. It is highly recommended that you are familiar with [Teams Core Concepts](/teams/core-concepts) before attempting this guide.
:::

## Authenticate the user to Entra ID to access Microsoft Graph APIs
A very common use case is to access enterprise related information about the user, which can be done through Microsoft Graph's APIs. To do that the user will have to be authenticated to Entra ID. 

:::note
See [How Auth Works](auth-sso) to learn more about how authentication works. 
:::

### Manual Setup

In this step you will have to tweak your Azure Bot service and App registration to add authentication configurations and enable Single Sign-On (SSO).

:::info
[Single Sign-On (SSO)](./auth-sso#single-sign-on-sso) in Teams allows users to access your app seamlessly by using their existing Teams account credentials for authentication. A user who has logged into Teams doesn't need to log in again to your app within the Teams environment.
:::

You can follow the [Enable SSO for bot and message extension app using Entra ID](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/bot-sso-register-aad?tabs=botid) guide in the Microsoft Learn docs.

### Using Microsoft 365 Agents Toolkit with the `teams` CLI

Open your terminal and navigate to the root folder of your app and run the following command:

```sh
teams config add atk.oauth
```

The `atk.oauth` configuration is a basic setup for Agents Toolkit along with configurations to authenticate the user with Microsoft Entra ID to access Microsoft Graph APIs.

This [CLI](/developer-tools/cli) command adds configuration files required by Agents Toolkit, including:

- Azure Application Entra ID manifest file `aad.manifest.json`.
- Azure bicep files to provision Azure bot in `infra/` folder.

:::info
Agents Toolkit, in the debugging flow, will deploy the `aad.manifest.json` and `infra/azure.local.bicep` file to provision the Application Entra ID and Azure bot with oauth configurations.
:::

## Authenticate the user to third-party identity provider

You can follow the [Add authentication to bot app](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/add-authentication?tabs=dotnet%2Cdotnet-sample) Microsoft Learn guide.

## Configure the OAuth Connection Name in the `App` instance

In the [Using Microsoft 365 Agents Toolkit with the `teams` CLI](#using-microsoft-365-agents-toolkit-with-the-teams-cli) guide, you will notice that the OAuth Connection Name that was created in the Azure Bot configuration is `graph`. This is arbitrary and you can even create more than one configuration. You can specify which configuration to use by defining it in the app options on intialization:

```python
from teams.app import App
from teams.logging import ConsoleLogger, ConsoleLoggerOptions

app = App(
    # The name of the auth connection to use.
    # It should be the same as the OAuth connection name defined in the Azure Bot configuration.
    default_connection_name="graph", 
    logger=ConsoleLogger().create_logger("tests/auth", options=ConsoleLoggerOptions(level="debug")))
```

### Using Multiple OAuth Connections

You can configure your app to work with multiple OAuth providers simultaneously. This is useful when your app needs to access different services:

```python
# Configure app with a default connection
app = App(
    default_connection_name="graph",  # Default for Microsoft Graph
    logger=ConsoleLogger().create_logger("app", options=ConsoleLoggerOptions(level="debug"))
)

# Sign in with the default connection (Microsoft Graph)
@app.on_message_pattern("/signin")
async def handle_signin(ctx: ActivityContext[MessageActivity]):
    await ctx.sign_in()  # Uses "graph" by default

# Sign in with a different connection
@app.on_message_pattern("/signin-github")
async def handle_github_signin(ctx: ActivityContext[MessageActivity]):
    await ctx.sign_in(connection_name="github")  # Uses "github" connection
```

:::tip
Each OAuth connection must be configured separately in your Azure Bot Service resource. Make sure the connection names match exactly.
:::

## Understanding OAuth Connection Settings

When setting up OAuth in Azure Bot Service, you'll need to configure several key settings:

| Setting | Description | Example |
|---------|-------------|---------|
| **Connection Name** | The identifier used in your code to reference this OAuth connection | `graph`, `github`, `custom-api` |
| **Service Provider** | The OAuth provider type | `Azure Active Directory v2`, `Generic OAuth 2` |
| **Client ID** | The application ID from your OAuth provider | `12345678-1234-1234-1234-123456789abc` |
| **Client Secret** | The secret key for your application | `your-client-secret` |
| **Scopes** | The permissions your app requests | `User.Read Mail.Read` |
| **Token Exchange URL** | (SSO only) The Application ID URI | `api://your-app-id` |

### SSO vs OAuth Configuration Differences

The main difference between SSO and OAuth configuration is the Token Exchange URL:

- **SSO**: Token Exchange URL must be set to your Application ID URI (e.g., `api://your-app-id`)
- **OAuth**: Token Exchange URL should be left blank

See [How Auth Works](./auth-sso) for more details on the differences between SSO and OAuth flows.

## Resources

- [User Authentication Basics](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-authentication?view=azure-bot-service-4.0)
- [User Authentication in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/authentication)

## Troubleshooting Common Issues

### "Invalid connection name" Error

**Problem**: The app cannot find the OAuth connection.

**Solution**:
1. Verify the connection name in your code matches exactly the name in Azure Bot Service
2. Check that the OAuth connection is properly configured in Azure
3. Ensure you're using the correct Azure Bot resource

```python
# Connection name must match exactly (case-sensitive)
app = App(default_connection_name="graph")  # Must match Azure configuration
```

### "ConsentRequired" Error

**Problem**: The user hasn't consented to the requested scopes.

**Solution**:
1. The user needs to complete the consent flow
2. For SSO, ensure the consent dialog is being shown to the user
3. Verify the scopes are properly configured in Azure

### "Token Exchange Failed" Error (SSO)

**Problem**: SSO token exchange is failing.

**Solution**:
1. Verify the Token Exchange URL is set correctly in Azure Bot Service (e.g., `api://your-app-id`)
2. Ensure the Application ID URI is configured in your Entra ID App Registration
3. Check that the `webApplicationInfo` section in your Teams manifest matches your App Registration

```json
// In manifest.json
"webApplicationInfo": {
  "id": "your-application-id",
  "resource": "api://your-application-id"
}
```

### Authentication Works Locally but Not in Teams

**Problem**: Auth works in local testing but fails when deployed.

**Solution**:
1. Ensure your bot endpoint is publicly accessible (not localhost)
2. Verify the messaging endpoint in Azure Bot Service points to your deployed app
3. Check that redirect URIs in your App Registration include your deployed URL
4. Make sure valid domains in your manifest include your app's domain

### User Token Not Available After Sign-In

**Problem**: `ctx.token` is `None` even after successful sign-in.

**Solution**:
1. Make sure you're checking for sign-in status with `ctx.is_signed_in`
2. Verify the sign-in event handler is properly registered
3. Check that the token is being stored correctly in the session state

```python
@app.event("sign_in")
async def handle_sign_in(event: SignInEvent):
    ctx = event.activity_ctx
    if ctx.token:
        await ctx.send("Sign-in successful!")
    else:
        await ctx.send("Sign-in completed but no token received.")
```

### "Forbidden" or "Insufficient Privileges" Error

**Problem**: Graph API calls fail with permission errors.

**Solution**:
1. Verify the required scopes are added to your App Registration in Azure
2. Ensure admin consent is granted if required by your organization
3. Ask the user to sign out and sign in again to get a token with updated permissions
4. Check that the scope names are correct (e.g., `User.Read` not `user.read`)

### Multiple Sign-In Prompts

**Problem**: Users are asked to sign in repeatedly.

**Solution**:
1. Check that token storage is working correctly
2. Verify your session management is maintaining state
3. For SSO, ensure the token exchange is configured properly
4. Check that cookies are enabled and not being blocked

### Debugging Tips

Enable detailed logging to diagnose authentication issues:

```python
from teams.logging import ConsoleLogger, ConsoleLoggerOptions

app = App(
    default_connection_name="graph",
    logger=ConsoleLogger().create_logger(
        "auth-debug",
        options=ConsoleLoggerOptions(level="debug")  # Enable debug logging
    )
)
```

Use the Bot Framework Emulator to test authentication locally:
1. Set up your bot in the [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator)
2. Configure OAuth settings in the emulator
3. Test the sign-in flow before deploying

Check Azure Bot Service logs:
1. Navigate to your Azure Bot resource
2. Go to **Monitoring** > **Logs**
3. Look for authentication-related errors