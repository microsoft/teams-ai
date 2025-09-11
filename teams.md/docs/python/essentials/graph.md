---
sidebar_position: 6
summary: A guide to using the Microsoft Graph API in Python, explaining the methods for accessing Microsoft 365 data using application or user tokens, with sample code for retrieving user details and integrating Graph API within message handlers.
---

# Graph API Client

[Microsoft Graph](https://docs.microsoft.com/en-us/graph/overview) gives you access to the wider Microsoft 365 ecosystem. You can enrich your application with data from across Microsoft 365.

The library gives your application easy access to the Microsoft Graph API via the `microsoft-teams-graph` package.

Microsoft Graph can be accessed by your application using its own application token, or by using the user's token. If you need access to resources that your application may not have, but your user does, you will need to use the user's scoped graph client. To grant explicit consent for your application to access resources on behalf of a user, follow the [auth guide](../in-depth-guides/user-authentication).
