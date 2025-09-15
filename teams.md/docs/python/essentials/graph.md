---
sidebar_position: 6
summary: A guide to using the Microsoft Graph API in Python, explaining the methods for accessing Microsoft 365 data using application or user tokens, with sample code for retrieving user details and integrating Graph API within message handlers.
---

# Graph API Client

[Microsoft Graph](https://docs.microsoft.com/en-us/graph/overview) gives you access to the wider Microsoft 365 ecosystem. You can enrich your application with data from across Microsoft 365.

The Teams AI SDK for Python provides easy access to the Microsoft Graph API via the `microsoft-teams-graph` package.

## Installation

The Graph functionality is available as an optional dependency. Install it using one of the following methods:

```bash
# Install with uv (recommended)
uv add microsoft-teams-graph

# Or install the Teams AI library with Graph support
uv add microsoft-teams-apps[graph]

# Alternative: Install with pip
pip install microsoft-teams-graph
pip install microsoft-teams-apps[graph]
```

:::note
The Graph package is architected as an optional dependency to keep the core Teams AI library lightweight. Only install it when you need to access Microsoft Graph APIs.
:::

## Overview

Microsoft Graph can be accessed by your application using its own application token, or by using the user's token. If you need access to resources that your application may not have, but your user does, you will need to use the user's scoped graph client. To grant explicit consent for your application to access resources on behalf of a user, follow the [auth guide](../in-depth-guides/user-authentication).

## Basic Usage

To access Microsoft Graph using a user's token, use the `get_graph_client()` function with the user's token from the activity context:

```python
from microsoft.teams.graph import get_graph_client
from microsoft.teams.apps import App, ActivityContext
from microsoft.teams.api import MessageActivity

app = App()

@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return

    # Create Graph client using user's token
    graph = get_graph_client(ctx.user_token)

    # Get user profile
    me = await graph.me.get()
    await ctx.send(f"Hello {me.display_name}!")

    # Get user's Teams
    teams = await graph.me.joined_teams.get()
    if teams and teams.value:
        team_names = [team.display_name for team in teams.value]
        await ctx.send(f"You're in {len(team_names)} teams: {', '.join(team_names)}")
```

For application-level access using the app's own token, you can access the application token from the context:

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    # Access Graph using application token
    app_graph = get_graph_client(ctx._app_token)

    # Get application details (requires appropriate app permissions)
    app_info = await app_graph.applications.get()
```

## Token Types

The `get_graph_client()` function accepts various token formats through the flexible `Token` type:

### String Token

The simplest approach is passing a token string directly:

```python
from microsoft.teams.graph import get_graph_client

# Direct string token
graph = get_graph_client("eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...")

# Make Graph API calls
me = await graph.me.get()
```

### Callable Token (Dynamic)

For scenarios where tokens need to be refreshed dynamically:

```python
def get_token():
    """Callable that returns a fresh token string."""
    # Fetch token from your token cache, API, etc.
    return get_access_token_from_somewhere()

# Use callable with get_graph_client
graph = get_graph_client(get_token)
```

### Async Callable Token

For asynchronous token retrieval:

```python
async def get_token_async():
    """Async callable that returns a fresh token string."""
    # Fetch token asynchronously
    token_response = await some_api_call()
    return token_response.access_token

# Use async callable
graph = get_graph_client(get_token_async)
```

### Teams Context Token

The most common pattern in Teams applications:

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return

    # Use the user token from context
    graph = get_graph_client(ctx.user_token)
    
    # Make Graph API calls
    me = await graph.me.get()
    await ctx.send(f"Hello {me.display_name}!")
```

## Authentication

The package uses Token-based authentication with automatic resolution through the Teams AI common library. Teams tokens are pre-authorized through the OAuth connection configured in your Azure Bot registration. The SDK handles all the authentication complexity for you.

## API Usage Examples

Here are some common Microsoft Graph API operations:

### User Profile

```python
# Get current user profile
me = await graph.me.get()
print(f"User: {me.display_name}")
print(f"Email: {me.user_principal_name}")
print(f"Job Title: {me.job_title}")
```

### Teams Membership

```python
# Get user's joined teams
teams = await graph.me.joined_teams.get()

if teams and teams.value:
    for team in teams.value:
        print(f"Team: {team.display_name}")
```

## Error Handling

Always handle authentication and API errors appropriately:

```python
from azure.core.exceptions import ClientAuthenticationError

@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    try:
        if not ctx.is_signed_in:
            await ctx.sign_in()
            return

        graph = get_graph_client(ctx.user_token)
        me = await graph.me.get()
        await ctx.send(f"Hello {me.display_name}!")

    except ClientAuthenticationError:
        await ctx.send("Authentication failed. Please try signing in again.")
        await ctx.sign_in()
    except Exception as e:
        await ctx.send(f"An error occurred: {str(e)}")
```

## Additional Resources

Microsoft Graph offers an extensive and thoroughly documented API surface. These essential resources will serve as your go-to references for any Graph development work:

- The [Microsoft Graph REST API reference documentation](https://learn.microsoft.com/en-us/graph/api/overview) gives details for each API, including permissions requirements.
- The [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) lets you discover and test drive APIs.

### Useful Graph Endpoints for Teams

| Graph endpoints | Description |
|----------------|-------------|
| [me](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http) | Current user information |
| [me/joinedTeams](https://learn.microsoft.com/en-us/graph/api/user-list-joinedteams?view=graph-rest-1.0) | Teams the user has joined |
| [me/messages](https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0) | User's email messages |
| [teams](https://learn.microsoft.com/en-us/graph/api/resources/team?view=graph-rest-1.0) | Team resources in Microsoft Teams |
| [chats](https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http) | Chat resources between users |
| [applications](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0) | Application resources |
