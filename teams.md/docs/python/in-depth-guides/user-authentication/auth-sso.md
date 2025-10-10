---
sidebar_position: 2
summary: Compare OAuth and SSO authentication methods in Teams apps and understand their implementation differences.
---

# How Auth Works

When building Teams applications, choosing the right authentication method is crucial for both security and user experience. Teams supports two primary authentication approaches: OAuth and Single Sign-On (SSO). While both methods serve the same fundamental purpose of validating user identity, they differ significantly in their implementation, supported identity providers, and user experience. Understanding these differences is essential for making the right choice for your application.

The following table provides a clear comparison between OAuth and SSO authentication methods, highlighting their key differences in terms of identity providers, authentication flows, and user experience.

## Single Sign-On (SSO)

Single Sign-On (SSO) in Teams provides a seamless authentication experience by leveraging a user's existing Teams identity. Once a user is logged into Teams, they can access your app without needing to sign in again. The only requirement is a one-time consent from the user, after which your app can securely retrieve their access details from Microsoft Entra ID. This consent is device-agnostic - once granted, users can access your app from any device without additional authentication steps.

When an access token expires, the app automatically initiates a token exchange flow. In this process:
1. The Teams client sends an OAuth ID token containing the user's information
2. Your app exchanges this ID token for a new access token with the previously consented scopes
3. This exchange happens silently without requiring user interaction

:::tip
Always use SSO if you authenticating the user with Microsoft Entra ID.
:::

### The SSO Signin Flow

The SSO signin flow involves several components working together. Here's how it works:

1. User interacts with your bot or message extension app
2. App initiates the signin process
3. If it's the first time:
   - User is shown a consent form for the requested scopes
   - Upon consent, Microsoft Entra ID issues an access token (in simple terms)
4. For subsequent interactions:
   - If token is valid, app uses it directly
   - If token expires, app silently signs the user in using the token exchange flow

See the [SSO in Teams at runtime](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/bot-sso-overview#sso-in-teams-at-runtime) guide to learn more about the SSO signin flow

### The SSO consent form

This is what the SSO consent form looks like in Teams:

![SSO Consent Form](/screenshots/auth-consent-popup.png)

## OAuth 

You can use a third-party OAuth Identity Provider (IdP) to authenticate your app users. The app user is registered with the identity provider, which has a trust relationship with your app. When the user attempts to log in, the identity provider validates the app user and provides them with access to your app. Microsoft Entra ID is one such third party OAuth provider. You can use other providers, such as Google, Facebook, GitHub, or any other provider.

### The OAuth Signin Flow

The OAuth signin flow involves several components working together. Here's how it works:

1. User interacts with your bot or message extension app
2. App sends a sign-in card with a link to the OAuth provider
3. User clicks the link and is redirected to the provider's authentication page
4. User authenticates and grants consent for requested scopes
5. Provider issues an access token to your app (in simple terms)
6. App uses the token to access services on user's behalf

When an access token expires, the user will need to go through the sign-in process again. Unlike SSO, there is no automatic token exchange - the user must explicitly authenticate each time their token expires.

### The OAuth Card

This is what the OAuth card looks like in Teams:

![OAuthCard](/screenshots/auth-explicit-signin.png)

## OAuth vs SSO - Head-to-Head Comparison

| Feature | OAuth | SSO |
|---------|-------|-----|
| Identity Provider | Works with any OAuth provider (Microsoft Entra ID, Google, Facebook, GitHub, etc.) | Only works with Microsoft Entra ID |
| Authentication Flow | User is sent a card with a sign-in link | If user has already consent to the requested scopes in the past they will "silently" login through the token exchange flow. Otherwise user is shown a consent form |
| User Experience | Requires explicit sign-in, and consent to scopes | Re-use existing Teams credential, Only requires consent to scopes |
| Conversation scopes (`personal`, `groupChat`, `teams`) | `personal` scope only | `personal` scope only |
| Azure Configuration differences | Same configuration except `Token Exchange URL` is blank | Same configuration except `Token Exchange URL` is set

## Implementation Examples

### Implementing SSO in Python

Here's a complete example of implementing SSO authentication:

```python
from teams.app import App
from teams.activity_context import ActivityContext
from teams.logging import ConsoleLogger, ConsoleLoggerOptions
from botbuilder.schema import MessageActivity

# Configure app with SSO
app = App(
    default_connection_name="graph",  # OAuth connection name from Azure
    logger=ConsoleLogger().create_logger("sso-app", options=ConsoleLoggerOptions(level="debug"))
)

@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    """Handle all messages with automatic SSO."""
    if not ctx.is_signed_in:
        # First time: user will see consent dialog
        # Subsequent times: silent sign-in via token exchange
        await ctx.send("Signing you in...")
        await ctx.sign_in()
        return
    
    # User is authenticated, access their information
    user = await ctx.user_graph.me.get()
    await ctx.send(f"Hello {user.display_name}! You're signed in with SSO.")

@app.event("sign_in")
async def on_sign_in(event: SignInEvent):
    """Called when SSO completes successfully."""
    ctx = event.activity_ctx
    user = await ctx.user_graph.me.get()
    await ctx.send(f"Welcome {user.display_name}! SSO authentication successful.")
```

### Implementing OAuth in Python

Here's a complete example of implementing traditional OAuth:

```python
from teams.app import App
from teams.activity_context import ActivityContext
from teams.logging import ConsoleLogger, ConsoleLoggerOptions
from botbuilder.schema import MessageActivity

# Configure app with OAuth
app = App(
    default_connection_name="github",  # OAuth connection for GitHub
    logger=ConsoleLogger().create_logger("oauth-app", options=ConsoleLoggerOptions(level="debug"))
)

@app.on_message_pattern("/signin")
async def handle_signin(ctx: ActivityContext[MessageActivity]):
    """Prompt user to sign in with OAuth card."""
    if ctx.is_signed_in:
        await ctx.send("You are already signed in!")
        return
    
    # Send OAuth card with customized text
    await ctx.sign_in(
        card_title="Sign In to GitHub",
        card_text="Please sign in to access your GitHub repositories",
        button_text="Sign In"
    )

@app.event("sign_in")
async def on_sign_in(event: SignInEvent):
    """Called when OAuth completes successfully."""
    ctx = event.activity_ctx
    token = ctx.token
    
    if token:
        await ctx.send(f"Successfully signed in to {token.connection_name}!")
        # Use the token to make API calls to the provider
    else:
        await ctx.send("Sign-in completed but no token received.")

@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    """Handle messages from authenticated users."""
    if not ctx.is_signed_in:
        await ctx.send("Please type '/signin' to authenticate.")
        return
    
    await ctx.send(f"You said: {ctx.activity.text}")
```

### Handling Multiple Authentication Methods

You can support both SSO and OAuth in the same app:

```python
from teams.app import App
from teams.activity_context import ActivityContext

# Default to SSO for Microsoft Graph
app = App(default_connection_name="graph")

@app.on_message_pattern("/signin-graph")
async def signin_graph(ctx: ActivityContext[MessageActivity]):
    """Sign in with SSO for Microsoft Graph."""
    await ctx.sign_in()  # Uses default "graph" connection with SSO

@app.on_message_pattern("/signin-github")
async def signin_github(ctx: ActivityContext[MessageActivity]):
    """Sign in with OAuth for GitHub."""
    await ctx.sign_in(
        connection_name="github",  # Explicit OAuth connection
        card_text="Sign in to access your GitHub data"
    )

@app.event("sign_in")
async def on_sign_in(event: SignInEvent):
    """Handle sign-in for any connection."""
    ctx = event.activity_ctx
    token = ctx.token
    
    if token.connection_name == "graph":
        user = await ctx.user_graph.me.get()
        await ctx.send(f"Signed in to Microsoft Graph as {user.display_name}")
    elif token.connection_name == "github":
        await ctx.send("Signed in to GitHub successfully")
```

## Decision Guide: Which Authentication Method to Choose?

### Use SSO When:
- ✅ Your app needs to access Microsoft 365 services (Graph API)
- ✅ You want the best user experience with minimal friction
- ✅ You need automatic token refresh
- ✅ Users are already signed into Teams with Microsoft accounts
- ✅ You want to leverage existing Teams credentials

### Use OAuth When:
- ✅ You need to authenticate with third-party services (GitHub, Google, Facebook, etc.)
- ✅ You need explicit user control over authentication
- ✅ The identity provider doesn't support SSO token exchange
- ✅ You want more control over the authentication flow
- ✅ Your users may not have Microsoft Entra ID accounts

### Use Both When:
- ✅ Your app integrates with both Microsoft services and third-party APIs
- ✅ You want to provide flexibility to users
- ✅ Different features require different identity providers

## Token Lifecycle Management

### SSO Token Lifecycle

```python
# Token lifecycle with SSO
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    # First time user interacts
    if not ctx.is_signed_in:
        await ctx.sign_in()  # User sees consent dialog
        return
    
    # Token is valid - use it
    # If token expires, Teams automatically exchanges it
    user = await ctx.user_graph.me.get()  # Works seamlessly
```

### OAuth Token Lifecycle

```python
# Token lifecycle with OAuth
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    # User must explicitly sign in
    if not ctx.is_signed_in:
        await ctx.send("Your session has expired. Please sign in again.")
        await ctx.sign_in()  # User sees OAuth card
        return
    
    # Token is valid - use it
    # When token expires, user must sign in again
```

## Common Scenarios and Solutions

### Scenario 1: User Profile Access
**Best Choice**: SSO
```python
# Seamless access to user profile
if ctx.is_signed_in:
    user = await ctx.user_graph.me.get()
    await ctx.send(f"Hello {user.display_name}!")
```

### Scenario 2: Third-Party API Integration
**Best Choice**: OAuth
```python
# Explicit OAuth for third-party services
await ctx.sign_in(connection_name="github")
# Use token to call GitHub API
```

### Scenario 3: Multi-Service Integration
**Best Choice**: Both
```python
# SSO for Microsoft services
await ctx.sign_in()  # Default graph connection

# OAuth for other services
await ctx.sign_in(connection_name="github")
```

## Resources

- [User Authentication Basics](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-authentication?view=azure-bot-service-4.0)
- [User Authentication in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/authentication)
- [Enable SSO for bot and message extension app using Entra ID](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/bot-sso-overview)
- [Add authentication to your Teams bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/add-authentication)