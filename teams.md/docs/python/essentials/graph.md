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
```

:::note
The Graph package is architected as an optional dependency to keep the core Teams AI library lightweight. Only install it when you need to access Microsoft Graph APIs.
:::

## Overview

Microsoft Graph can be accessed by your application using its own application token, or by using the user's token. If you need access to resources that your application may not have, but your user does, you will need to use the user's scoped graph client. To grant explicit consent for your application to access resources on behalf of a user, follow the [auth guide](../in-depth-guides/user-authentication).

## Basic Usage

The Teams AI SDK provides convenient properties on the activity context to access Microsoft Graph:

### User Graph Client

To access Microsoft Graph using a user's token, use the `user_graph` property:

```python
from microsoft.teams.apps import App, ActivityContext
from microsoft.teams.api import MessageActivity

app = App()

@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return

    try:
        # Access user's Graph data directly
        me = await ctx.user_graph.me.get()
        await ctx.send(f"Hello {me.display_name}!")

        # Get user's Teams
        teams = await ctx.user_graph.me.joined_teams.get()
        if teams and teams.value:
            team_names = [team.display_name for team in teams.value]
            await ctx.send(f"You're in {len(team_names)} teams: {', '.join(team_names)}")

    except Exception as e:
        await ctx.send(f"An error occurred: {str(e)}")
```

### App Graph Client

For application-level access using the app's own token, use the `app_graph` property:

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    try:
        # Access Graph using application token
        # (requires appropriate app permissions)
        app_info = await ctx.app_graph.applications.get()
        await ctx.send(f"App information retrieved successfully")
    except ValueError as e:
        await ctx.send("App Graph access not available")
    except Exception as e:
        await ctx.send(f"An error occurred: {str(e)}")
```

## Authentication

The package uses Token-based authentication with automatic resolution through the Teams AI common library. Teams tokens are pre-authorized through the OAuth connection configured in your Azure Bot registration. The SDK handles all the authentication complexity for you.

When you access `ctx.user_graph` or `ctx.app_graph`, the SDK automatically:
- Checks for valid tokens
- Creates the appropriate Graph client
- Handles token refresh as needed
- Provides proper error handling

## API Usage Examples

Here are some common Microsoft Graph API operations:

### User Profile

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return

    try:
        # Get current user profile
        me = await ctx.user_graph.me.get()
        profile_info = f"""
**Your Profile**
Name: {me.display_name or 'N/A'}
Email: {me.user_principal_name or 'N/A'}
Job Title: {me.job_title or 'N/A'}
"""
        await ctx.send(profile_info)
    except Exception as e:
        await ctx.send(f"Error getting profile: {str(e)}")
```

### Teams Membership

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return

    try:
        # Get user's joined teams
        teams = await ctx.user_graph.me.joined_teams.get()
        
        if teams and teams.value:
            team_list = "\n".join([f"• {team.display_name}" for team in teams.value])
            await ctx.send(f"**Your Teams:**\n{team_list}")
        else:
            await ctx.send("You're not a member of any teams.")
    except Exception as e:
        await ctx.send(f"Error getting teams: {str(e)}")
```

### Using Parameters

Many Graph API calls accept parameters for filtering, selecting specific fields, or pagination:

```python
from msgraph_core import QueryParameters

@app.on_message
async def handle_message_with_params(ctx: ActivityContext[MessageActivity]):
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return

    try:
        # Get user's messages with specific parameters
        query_params = QueryParameters(
            select=["subject", "from", "receivedDateTime"],
            filter="isRead eq false",
            top=10,
            orderby=["receivedDateTime desc"]
        )
        
        messages = await ctx.user_graph.me.messages.get(request_configuration=query_params)
        
        if messages and messages.value:
            message_list = "\n".join([
                f"• {msg.subject} (from: {msg.from_.email_address.name})" 
                for msg in messages.value
            ])
            await ctx.send(f"**Recent Unread Messages:**\n{message_list}")
        else:
            await ctx.send("No unread messages found.")
    except Exception as e:
        await ctx.send(f"Error getting messages: {str(e)}")
```

## Error Handling

The Graph properties handle most errors automatically, but you should still implement proper error handling:

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    try:
        if not ctx.is_signed_in:
            await ctx.sign_in()
            return

        me = await ctx.user_graph.me.get()
        await ctx.send(f"Hello {me.display_name}!")

    except ValueError as e:
        # User not signed in or no token available
        await ctx.send("Please sign in to access Microsoft Graph.")
        await ctx.sign_in()
    except ImportError as e:
        # Graph dependencies not installed
        await ctx.send("Graph functionality not available. Please install the graph package.")
    except Exception as e:
        # Other errors (API errors, network issues, etc.)
        await ctx.send(f"An error occurred: {str(e)}")
```

## Additional Resources

Microsoft Graph offers an extensive and thoroughly documented API surface. These essential resources will serve as your go-to references for any Graph development work:

- The [Microsoft Graph REST API reference documentation](https://learn.microsoft.com/en-us/graph/api/overview) gives details for each API, including permissions requirements.
- The [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) lets you discover and test drive APIs.

### Useful Graph Endpoints for Teams

| Graph endpoints | Description |
|----------------|-------------|
| [appCatalogs](https://learn.microsoft.com/en-us/graph/api/appcatalogs-list-teamsapps?view=graph-rest-1.0) | Apps in the Teams App Catalog |
| [appRoleAssignments](https://learn.microsoft.com/en-us/graph/api/serviceprincipal-list-approleassignments?view=graph-rest-1.0) | App role assignments |
| [applicationTemplates](https://learn.microsoft.com/en-us/graph/api/resources/applicationtemplate?view=graph-rest-1.0) | Applications in the Microsoft Entra App Gallery |
| [applications](https://learn.microsoft.com/en-us/graph/api/resources/application?view=graph-rest-1.0) | Application resources |
| [chats](https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0&tabs=http) | Chat resources between users |
| [communications](https://learn.microsoft.com/en-us/graph/api/application-post-calls?view=graph-rest-1.0) | Calls and Online meetings |
| [employeeExperience](https://learn.microsoft.com/en-us/graph/api/resources/engagement-api-overview?view=graph-rest-1.0) | Employee Experience and Engagement |
| [me](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http) | Same as `/users` but scoped to one user (who is making the request) |
| [teams](https://learn.microsoft.com/en-us/graph/api/resources/team?view=graph-rest-1.0) | Team resources in Microsoft Teams |
| [teamsTemplates](https://learn.microsoft.com/en-us/microsoftteams/get-started-with-teams-templates) | Templates used to create teams |
| [teamwork](https://learn.microsoft.com/en-us/graph/api/resources/teamwork?view=graph-rest-1.0) | A range of Microsoft Teams functionalities |
| [users](https://learn.microsoft.com/en-us/graph/api/resources/users?view=graph-rest-1.0) | User resources |
