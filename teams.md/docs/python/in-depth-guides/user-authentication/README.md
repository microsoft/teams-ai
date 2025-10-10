---
sidebar_position: 4
summary: Enable user authentication in Teams apps to access secured resources like email, flight status, and online services.
---

# 🔒 User Authentication

At times agents must access secured online resources on behalf of the user, such as checking email, checking on flight status, or placing an order. To enable this, the user must authenticate their identity and grant consent for the application to access these resources. This process results in the application receiving a token, which the application can then use to access the permitted resources on the user's behalf.

## Overview

The Teams AI Library for Python provides a streamlined approach to implementing user authentication in your Teams applications. The library supports both Single Sign-On (SSO) and traditional OAuth 2.0 flows, making it easy to integrate with Microsoft Entra ID (formerly Azure AD) and other identity providers.

### Key Features

- **Simple Authentication API**: Sign users in with a single method call
- **SSO Support**: Seamless authentication using Teams credentials
- **Multiple OAuth Providers**: Support for Microsoft Graph, GitHub, Google, and custom providers
- **Automatic Token Management**: Handles token storage and refresh automatically
- **Built-in Graph Client**: Easy access to Microsoft Graph APIs after authentication

## Getting Started

If you're new to user authentication in Teams apps, follow these steps:

1. **[Quickstart](./quickstart)** - Create a Teams app with authentication using the `graph` template
2. **[App Setup](./setup)** - Configure OAuth connections and understand setup options
3. **[How Auth Works](./auth-sso)** - Learn about SSO vs OAuth and choose the right approach
4. **[Signing In](./signin)** - Implement the sign-in flow in your app
5. **[Using Microsoft Graph API](./using-graph-api)** - Access Microsoft 365 data after authentication
6. **[Signing Out](./signout)** - Implement sign-out functionality

## Common Authentication Scenarios

### Scenario 1: Access User Profile from Microsoft Graph

```python
from teams.app import App
from teams.activity_context import ActivityContext

app = App(default_connection_name="graph")

@app.on_message_pattern("/profile")
async def show_profile(ctx: ActivityContext):
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return
    
    user = await ctx.user_graph.me.get()
    await ctx.send(f"Hello, {user.display_name}!")
```

### Scenario 2: Check Authentication Status

```python
@app.on_message
async def handle_message(ctx: ActivityContext):
    if ctx.is_signed_in:
        await ctx.send("You are signed in and ready to go!")
    else:
        await ctx.send("Please sign in to continue.")
        await ctx.sign_in()
```

### Scenario 3: Access User Token

```python
@app.event("sign_in")
async def on_sign_in(event: SignInEvent):
    ctx = event.activity_ctx
    token = ctx.token
    
    if token:
        await ctx.send(f"Signed in! Token expires: {token.expiration}")
```

## Choosing Between SSO and OAuth

| Use Case | Recommended Method |
|----------|-------------------|
| Accessing Microsoft 365 data (Graph APIs) | **SSO** - Provides seamless user experience |
| Third-party services (GitHub, Google, etc.) | **OAuth** - Required for non-Microsoft providers |
| Need custom consent flow | **OAuth** - More control over the authentication process |
| Want automatic token refresh | **SSO** - Handles token exchange automatically |

See [How Auth Works](./auth-sso) for a detailed comparison.

## Prerequisites

Before implementing authentication:

1. An Azure subscription with an App Registration
2. An Azure Bot Service resource configured with OAuth settings
3. Appropriate API permissions configured for your app
4. Teams manifest updated with authentication configuration

See [App Setup](./setup) for detailed configuration steps.

## Best Practices

1. **Always Check Sign-In Status**: Before accessing protected resources, verify the user is authenticated
2. **Handle Errors Gracefully**: Implement proper error handling for authentication failures
3. **Request Minimal Permissions**: Only request the OAuth scopes your app actually needs
4. **Use SSO When Possible**: For Microsoft services, SSO provides the best user experience
5. **Implement Sign-Out**: Always provide users a way to sign out of your app

## Common Pitfalls to Avoid

- ❌ Not checking `is_signed_in` before accessing authenticated resources
- ❌ Requesting unnecessary OAuth scopes
- ❌ Hardcoding connection names instead of using configuration
- ❌ Ignoring token expiration and refresh logic
- ❌ Not handling consent errors properly

## Architecture Overview

```
User → Teams Client → Bot Service → Your App
                           ↓
                    OAuth Connection
                           ↓
                    Identity Provider (Entra ID, etc.)
                           ↓
                    Access Token → Microsoft Graph API
```

1. User interacts with your bot in Teams
2. App requests authentication via Bot Service
3. Bot Service redirects to configured identity provider
4. User authenticates and consents to permissions
5. Identity provider issues access token
6. App uses token to access protected APIs on user's behalf

## Resources

- [User Authentication Basics](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-authentication?view=azure-bot-service-4.0)
- [User Authentication in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/authentication)
- [Microsoft Graph Documentation](https://learn.microsoft.com/en-us/graph/overview)
- [OAuth 2.0 Documentation](https://oauth.net/2/)