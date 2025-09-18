---
sidebar_position: 3
summary: 
llms: ignore
---

# Deployment Guide

We cover the most common setup and deployment steps for testing in teams, including configuration instructions, and references for handling potential issues during deployment.

### User Assigned Managed Identity

This section demonstrates how to configure authentication in your application using a **User Assigned Managed Identity** in Azure. If you are using `msaAppType: 'UserAssignedMSI'` for the Azure Bot Service, for example the C# atk.basic configuration while deploying in Azure.

Replace
```typescript
const app = new App({
  plugins: [new DevtoolsPlugin()],
});
```
with in your index.ts .

```typescript
// Create token factory function for Azure Identity
const createTokenFactory = () => {
  return async (scope: string | string[], tenantId?: string): Promise<string> => {
    const managedIdentityCredential = new ManagedIdentityCredential({
        clientId: process.env.CLIENT_ID
      });
    const scopes = Array.isArray(scope) ? scope : [scope];
    const tokenResponse = await managedIdentityCredential.getToken(scopes, {
      tenantId: tenantId
    });
   
    return tokenResponse.token;
  };
};

// Configure authentication using TokenCredentials
const tokenCredentials: TokenCredentials = {
  clientId: process.env.CLIENT_ID || '',
  token: createTokenFactory()
};

const app = new App({
  ...tokenCredentials,
  plugins: [new DevtoolsPlugin()],
});
```

### Missing Service Principal in the Tenant

This error occurs when the application has a single-tenant Azure Bot Service instance, but your app registration has not yet been linked to a Service Principal in the tenant.  

![Service Principal Error](/screenshots/service-principal-error.png)  

1. **Sign in to Azure Portal**  
   Go to [https://portal.azure.com](https://portal.azure.com) and log in with your Azure account.
2. **Navigate to App Registrations**  
   In the top search bar, search for **App registrations** and select it.
3. **Search for your application**  
   Use the **BOT_ID** from your environment file:  
   - Local development → `env/.env.local`  
   - Azure deployment → `env/.env.dev`
4. **Check if a Service Principal exists**  
   Open the app registration and verify if a Service Principal is created. If it exists already, you should see an entry for a **Managed Application in your local directory** if it exists.
    ![Existing Service Principal](/screenshots/existing-service-principal.png)
5. **Create a Service Principal if missing**  
   If it doesn’t exist, click **Create Service Principal** . Wait for the page to load.
   ![Create Service Principal](/screenshots/create-service-principal.png)
6. **Restart your app**  
   Once the Service Principal is created, restart your application.