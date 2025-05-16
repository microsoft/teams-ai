---
sidebar_position: 4
---

# Functions

The client App exposes an `exec()` method that can be used to call functions implemented in an agent created with this library. The function call uses the `app.http` client to make a request, attaching a bearer token created from the `app.msalInstance` MSAL public client application, so that the remote function can authenticate and authorize the caller.

The `exec()` method supports passing arguments and provides options to attach custom request headers and/or controlling the MSAL token scope.

## Invoking a remote function
When the tab app and the remote agent are deployed to the same location and in the same AAD app, it's simple to construct the client app and call the function.


```typescript
import { App } from '@microsoft/teams.client';

const app = new App(clientId);
await app.start();

// this requests a token for 'api://<clientId>/access_as_user' and attaches
// that to an HTTP POST request to /api/functions/my-function
const result = await app.exec<string>('my-function');
```

If the deployment is more complex, the [AppOptions](./app-options.md) can be used to influence the URL as well as the scope in the token.

## Function arguments
Any argument for the remote function can be provided as an object.


```typescript
const args = { arg1: 'value1', arg2: 'value2' };
const result = await app.exec('my-function', args);
```


## Request headers
By default, the HTTP request will include a header with a bearer token as well as headers that give contextual information about the state of the app, such as which channel or team or chat or meeting the tab is active in.

If needed, you can add additional headers to the `requestHeaders` option field. This may be handy to provide additional context to the remote function, such as a logging correlation ID.


```typescript
const requestHeaders = {
  'x-custom-correlation-id': 'bf12aa3c-7460-4644-a22e-fb890af2ff41',
};

// custom headers when the function does not take arguments
const result = await app.exec('my-function', undefined, { requestHeaders} );

// custom headers when the function takes arguments
const args = { arg1: 'value1', arg2: 'value2' };
const result = await app.exec('my-other-function', args, { requestHeaders} );
```


## Request bearer token
By default, the HTTP request will include a header with a bearer token acquired by requesting an `access_as_user` permission. The resource used for the request depends on the `remoteApiOptions.remoteAppResource` [AppOption](./app-options.md). If this app option is not provided, the token is requested for the scope `api://<clientId>/access_as_user`. If this option is provided, the token is requested for the scope `<remoteApiOptions.remoteAppResource>/access_as_user`.

When calling a function that requires a different permission or scope, the `exec` options let you override the behavior. 

To specify a custom permission, set the permission field in the `exec` options.


```typescript
// with this option, the exec() call will request a token for either
// api://<clientId>/my_custom_permission or 
// <remoteApiOptions.remoteAppResource>/my_custom_permission, 
// depending on the app options used.
const options = {
  permission: 'my_custom_permission'
};

// custom permission when the function does not take arguments
const result = await app.exec('my-function', undefined, options );

// custom permission when the function takes arguments
const args = { arg1: 'value1', arg2: 'value2' };
const result = await app.exec('my-other-function', args, options );
```


Sometimes you may need even more control. You might for need a scope for a different resource than your default when calling a particular remote agent function. In these cases you can provide the exact token request object you need as part of the `exec` options.


```typescript
// with this option, the exec() call will request a token for exactly
// api://my-custom-resources/my_custom_scope, regardless of which app
// options were used to construct the app.
const options = {
  msalTokenRequest: {
    scopes: ['api://my-custom-resources/my_custom_scope'],
  },
};

// custom token request when the function does not take arguments
const result = await app.exec('my-function', undefined, options );

// custom token request when the function takes arguments
const args = { arg1: 'value1', arg2: 'value2' };
const result = await app.exec('my-other-function', args, options );
```


## Ensuring user consent
The `exec()` function supports incremental, just-in-time consent such that the user is prompted to consent during the `exec()` call, if they haven't already consented earlier.

If you find that you'd rather test for consent or request consent before making the `exec()` call, the `hasConsentForScopes` and  `ensureConsentForScopes` can be used. More details about those are given in the [Graph](./graph.md) section.

## References
- [Graph API overview](https://learn.microsoft.com/en-us/graph/api/overview)
- [Graph API permissions overview](https://learn.microsoft.com/en-us/graph/permissions-reference)
