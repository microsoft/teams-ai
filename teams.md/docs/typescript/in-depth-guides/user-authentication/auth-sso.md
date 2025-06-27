---
sidebar_position: 2
summary: Comparison and explanation of OAuth and Single Sign-On (SSO) authentication methods in Teams applications.
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



## Resources

- [User Authentication Basics](https://learn.microsoft.com/en-us/azure/bot-service/bot-builder-concept-authentication?view=azure-bot-service-4.0)
- [User Authentication in Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/authentication/authentication)
- [Enable SSO for bot and message extension app using Entra ID](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/bot-sso-overview)
- [Add authentication to your Teams bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/add-authentication)