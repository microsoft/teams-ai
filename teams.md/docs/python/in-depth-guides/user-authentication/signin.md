---
sidebar_position: 4
summary: How to implement user sign-in with OAuth in Python Teams AI applications using the built-in signin method.
---

# Signing In

Prompting the user to sign in using an `OAuth` connection has
never been easier! Just use the `sign_in` method to send the request
and the listen to the `sign_in` event to handle the token result.

## Basic Sign-In Flow

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    """Handle message activities using the new generated handler system."""
    ctx.logger.info("User requested sign-in.")
    if ctx.is_signed_in:
        await ctx.send("You are already signed in.")
    else:
        await ctx.sign_in()


@app.event("sign_in")
async def handle_sign_in(event: SignInEvent):
    """Handle sign-in events."""
    await event.activity_ctx.send("You are now signed in!")

```

## Customizing the OAuth Card

When using the OAuth authentication flow (not SSO), you can customize the sign-in card that is presented to the user:

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    """Handle message activities with customized OAuth card."""
    if ctx.is_signed_in:
        await ctx.send("You are already signed in.")
    else:
        # Customize the OAuth card appearance
        await ctx.sign_in(
            card_title="Sign In Required",
            card_text="Please sign in to access this feature",
            button_text="Sign In"
        )
```

:::note
The OAuth card customization only applies to the explicit OAuth flow. When using SSO (Single Sign-On), the user sees a consent dialog instead of an OAuth card.
:::

## Accessing the User Token

Once the user has signed in, you can access their authentication token through the `ActivityContext`:

```python
@app.event("sign_in")
async def handle_sign_in(event: SignInEvent):
    """Handle sign-in events and access the token."""
    ctx = event.activity_ctx
    
    # Access the token
    token = ctx.token
    if token:
        await ctx.send(f"Successfully signed in! Token expires at: {token.expiration}")
        # The token can be used to make authenticated API calls
    else:
        await ctx.send("Sign-in completed but no token received.")
```

## Using Multiple OAuth Connections

If your app uses multiple OAuth connections, you can specify which connection to use:

```python
# Configure multiple connections in your app
app = App(
    default_connection_name="graph",  # Default connection for Microsoft Graph
    logger=ConsoleLogger().create_logger("app", options=ConsoleLoggerOptions(level="debug"))
)

@app.on_message_pattern("/signin-graph")
async def handle_graph_signin(ctx: ActivityContext[MessageActivity]):
    """Sign in using the Microsoft Graph connection."""
    await ctx.sign_in()  # Uses default connection "graph"

@app.on_message_pattern("/signin-custom")
async def handle_custom_signin(ctx: ActivityContext[MessageActivity]):
    """Sign in using a custom OAuth connection."""
    await ctx.sign_in(connection_name="custom-provider")  # Use specific connection
```

:::tip
Make sure the connection name you specify matches the OAuth connection name configured in your Azure Bot Service resource.
:::

## Checking Sign-In Status

You can check if a user is already signed in before prompting them:

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    """Check sign-in status before proceeding."""
    if ctx.is_signed_in:
        # User is already authenticated
        await ctx.send("You are authenticated. Processing your request...")
        # Proceed with authenticated operations
    else:
        # User needs to sign in
        await ctx.send("Please sign in to continue.")
        await ctx.sign_in()
```

## Error Handling

Handle authentication errors gracefully:

```python
@app.event("error")
async def handle_error(event: ErrorEvent):
    """Handle authentication errors."""
    error = event.error
    ctx = event.activity_ctx
    
    if ctx and "auth" in str(error).lower():
        await ctx.send("Authentication error occurred. Please try signing in again.")
    else:
        await ctx.send(f"An error occurred: {str(error)}")
```