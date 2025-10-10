---
sidebar_position: 6
summary: Learn how to use the Microsoft Graph API after user authentication in Python Teams AI applications.
---

# Using Microsoft Graph API

After successfully authenticating a user, you can use the Microsoft Graph API to access user data and Microsoft 365 services on their behalf.

## Prerequisites

Before using the Graph API, ensure:
1. Your app is properly configured with Microsoft Entra ID authentication
2. The user has successfully signed in
3. Your app has the necessary Microsoft Graph permissions (scopes)

See [App Setup](./setup) for configuration details.

## Accessing the Graph Client

The Teams AI SDK provides a convenient Graph client through the `ActivityContext`:

```python
from teams.app import App
from teams.activity_context import ActivityContext
from botbuilder.schema import MessageActivity

app = App(default_connection_name="graph")

@app.on_message_pattern("/profile")
async def handle_profile(ctx: ActivityContext[MessageActivity]):
    """Get and display user profile information."""
    if not ctx.is_signed_in:
        await ctx.send("Please sign in first.")
        await ctx.sign_in()
        return
    
    # Access the user's profile using the Graph API
    try:
        # The token is automatically included in API calls
        user_info = await ctx.user_graph.me.get()
        
        response = f"""
        **Your Profile:**
        - Name: {user_info.display_name}
        - Email: {user_info.mail or user_info.user_principal_name}
        - Job Title: {user_info.job_title or 'N/A'}
        """
        await ctx.send(response)
    except Exception as e:
        await ctx.send(f"Error retrieving profile: {str(e)}")
```

## Common Graph API Operations

### Get User Information

```python
@app.on_message_pattern("/me")
async def handle_me(ctx: ActivityContext[MessageActivity]):
    """Get basic user information."""
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return
    
    user = await ctx.user_graph.me.get()
    await ctx.send(f"Hello {user.display_name}!")
```

### Get User's Manager

```python
@app.on_message_pattern("/manager")
async def handle_manager(ctx: ActivityContext[MessageActivity]):
    """Get user's manager information."""
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return
    
    try:
        manager = await ctx.user_graph.me.manager.get()
        await ctx.send(f"Your manager is: {manager.display_name}")
    except Exception as e:
        await ctx.send("Could not retrieve manager information.")
```

### List User's Recent Emails

```python
@app.on_message_pattern("/emails")
async def handle_emails(ctx: ActivityContext[MessageActivity]):
    """List user's recent emails."""
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return
    
    try:
        # Get the top 5 messages
        messages = await ctx.user_graph.me.messages.get(top=5)
        
        email_list = "**Your Recent Emails:**\n"
        for msg in messages.value:
            email_list += f"- {msg.subject} (from: {msg.from_.email_address.name})\n"
        
        await ctx.send(email_list)
    except Exception as e:
        await ctx.send(f"Error retrieving emails: {str(e)}")
```

:::warning
Ensure your app has the `Mail.Read` scope configured in Azure to access email data.
:::

### Get User's Calendar Events

```python
@app.on_message_pattern("/calendar")
async def handle_calendar(ctx: ActivityContext[MessageActivity]):
    """List user's upcoming calendar events."""
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return
    
    try:
        # Get upcoming events
        events = await ctx.user_graph.me.calendar.events.get(top=5)
        
        event_list = "**Your Upcoming Events:**\n"
        for event in events.value:
            event_list += f"- {event.subject} at {event.start.date_time}\n"
        
        await ctx.send(event_list)
    except Exception as e:
        await ctx.send(f"Error retrieving calendar: {str(e)}")
```

:::warning
Ensure your app has the `Calendars.Read` scope configured in Azure to access calendar data.
:::

## Making Custom Graph API Calls

You can make custom Graph API calls using the underlying HTTP client:

```python
@app.on_message_pattern("/custom-call")
async def handle_custom(ctx: ActivityContext[MessageActivity]):
    """Make a custom Graph API call."""
    if not ctx.is_signed_in:
        await ctx.sign_in()
        return
    
    try:
        # Access the token to make custom HTTP requests
        token = ctx.token
        
        # Make a custom API call using the token
        import aiohttp
        headers = {
            "Authorization": f"Bearer {token.token}",
            "Content-Type": "application/json"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://graph.microsoft.com/v1.0/me/drive/root/children",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    await ctx.send(f"Found {len(data.get('value', []))} items in your OneDrive")
                else:
                    await ctx.send("Error accessing OneDrive")
    except Exception as e:
        await ctx.send(f"Error: {str(e)}")
```

## Handling Permissions and Scopes

Different Graph API operations require different permissions. Common scopes include:

| Scope | Purpose |
|-------|---------|
| `User.Read` | Read basic user profile |
| `User.ReadBasic.All` | Read basic profiles of all users |
| `Mail.Read` | Read user's email |
| `Mail.Send` | Send email as the user |
| `Calendars.Read` | Read user's calendars |
| `Calendars.ReadWrite` | Read and write to user's calendars |
| `Files.Read` | Read user's files |
| `Files.ReadWrite` | Read and write to user's files |

To add scopes to your app:
1. Navigate to your App Registration in Azure Portal
2. Go to **API Permissions**
3. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
4. Search and select the required scopes
5. Click **Add permissions**

:::tip
Request only the minimum permissions your app needs. Users are more likely to consent to apps that request fewer permissions.
:::

## Best Practices

### 1. Always Check Authentication Status

```python
if not ctx.is_signed_in:
    await ctx.sign_in()
    return
```

### 2. Handle Errors Gracefully

```python
try:
    result = await ctx.user_graph.me.get()
except Exception as e:
    ctx.logger.error(f"Graph API error: {str(e)}")
    await ctx.send("An error occurred. Please try again later.")
```

### 3. Use Specific Scopes

Only request the permissions your app actually needs.

### 4. Cache Results When Appropriate

If data doesn't change frequently, consider caching results to reduce API calls:

```python
# Example: Cache user profile for the session
if not hasattr(ctx.state.user, 'profile'):
    ctx.state.user.profile = await ctx.user_graph.me.get()

profile = ctx.state.user.profile
await ctx.send(f"Welcome back, {profile.display_name}!")
```

## Troubleshooting

### "Insufficient privileges" Error

This error occurs when your app doesn't have the required permissions:
- Verify the scope is added to your App Registration
- Ensure admin consent is granted (if required)
- Ask the user to sign out and sign in again to refresh their token

### Token Expiration

Tokens expire after a certain period. The SDK handles token refresh automatically for SSO, but for OAuth flows, the user may need to sign in again:

```python
if not ctx.is_signed_in:
    await ctx.send("Your session has expired. Please sign in again.")
    await ctx.sign_in()
    return
```

### Rate Limiting

Microsoft Graph has rate limits. Implement retry logic and respect the `Retry-After` header:

```python
import asyncio

async def call_graph_with_retry(ctx, max_retries=3):
    """Call Graph API with retry logic."""
    for attempt in range(max_retries):
        try:
            return await ctx.user_graph.me.get()
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise
```

## Resources

- [Microsoft Graph Documentation](https://learn.microsoft.com/en-us/graph/overview)
- [Graph API Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) - Test Graph API calls
- [Microsoft Graph Python SDK](https://github.com/microsoftgraph/msgraph-sdk-python)
