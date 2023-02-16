import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import 'isomorphic-fetch';
import { settings, ISettings } from './appSettings';

let _userClient: Client;

const initializeGraphForUserAuth = (settings: ISettings) => {
    if (!settings) {
        throw new Error('Settings cannot be undefined');
    }

    console.log('Initializing Graph for user auth...');

    const credential = new ClientSecretCredential(settings.tenantId, settings.clientId, settings.clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: settings.scopes
    });

    _userClient = Client.initWithMiddleware({
        authProvider
    });
};

export const sendMailGraph = async (senderUserId: string, subject: string, body: string, recipient: string) => {
    initializeGraphForUserAuth(settings);

    // Create a new message
    const message = {
        subject,
        body: {
            content: body,
            contentType: 'text'
        },
        toRecipients: [
            {
                emailAddress: {
                    address: recipient
                }
            }
        ]
    };

    return _userClient.api(`/users/${senderUserId}/sendMail`).post({
        message
    });
};
