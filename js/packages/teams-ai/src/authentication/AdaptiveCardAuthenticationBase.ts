import { ActivityTypes, InvokeResponse, TokenResponse, TurnContext } from 'botbuilder';
import { ACTION_INVOKE_NAME } from '../AdaptiveCards';

/**
 * @internal
 */
export interface AdaptiveCardLoginRequest {
    statusCode: number;
    type: 'application/vnd.microsoft.activity.loginRequest';
    value: {
        text: string;
        connectionName: string;
        tokenExchangeResource?: {
            id: string;
            uri: string;
            providerId?: string;
        };
        buttons: {
            title: string;
            text: string;
            type: string;
            value: string;
        }[];
    };
}

/**
 * @internal
 *
 * Base class to handle adaptive card authentication.
 */
export abstract class AdaptiveCardAuthenticationBase {
    /**
     * Authenticates the user.
     * @param {TurnContext} context - The turn context.
     * @returns {Promise<string | undefined>} - The authentication token, or undefined if authentication failed. Teams will ask user to sign-in if authentication failed.
     */
    public async authenticate(context: TurnContext): Promise<string | undefined> {
        const value = context.activity.value;

        const tokenExchangeRequest = value.authentication;

        // Token Exchange
        if (tokenExchangeRequest && tokenExchangeRequest.token) {
            try {
                const tokenExchangeResponse = await this.handleSsoTokenExchange(context);
                if (tokenExchangeResponse && tokenExchangeResponse.token) {
                    return tokenExchangeResponse.token;
                }
            } catch (err) {
                // Ignore Exceptions
                // If token exchange failed for any reason, tokenExchangeResponse above stays null, and hence we send back a failure invoke response to the caller.
                console.log('tokenExchange error: ' + err);
            }

            // Token exchange failed, asks user to sign in and consent.
            await context.sendActivity({
                value: {
                    body: {
                        statusCode: 412,
                        type: 'application/vnd.microsoft.error.preconditionFailed',
                        value: {
                            code: '412',
                            message: 'Failed to exchange token'
                        }
                    },
                    status: 200
                } as InvokeResponse,
                type: ActivityTypes.InvokeResponse
            });

            return undefined;
        }

        // When the Bot Service Auth flow completes, the query.State will contain a magic code used for verification.
        const magicCode = value.state && Number.isInteger(Number(value.state)) ? value.state : '';

        if (magicCode) {
            // User sign in completes, the query.State will contain a magic code used for verification.
            // This happens when an "auth" action is sent to Teams, or the token exchange failed in above step.
            const tokenResponse = await this.handleUserSignIn(context, magicCode);
            if (tokenResponse && tokenResponse.token) {
                return tokenResponse.token;
            }
        }

        // There is no token, so the user has not signed in yet.
        const response = await this.getLoginRequest(context);

        // Queue up invoke response
        await context.sendActivity({
            value: { body: response, status: 200 } as InvokeResponse,
            type: ActivityTypes.InvokeResponse
        });

        return;
    }

    /**
     * Checks if the activity is a valid Adaptive Card activity that supports authentication.
     * @param {TurnContext} context - The turn context.
     * @returns {boolean} A boolean indicating if the activity is valid.
     */
    public isValidActivity(context: TurnContext): boolean {
        return context.activity.type == ActivityTypes.Invoke && context.activity.name == ACTION_INVOKE_NAME;
    }

    /**
     * Handles the SSO token exchange.
     * @param context - The turn context.
     * @returns A promise that resolves to the token response or undefined if token exchange failed.
     */
    public abstract handleSsoTokenExchange(context: TurnContext): Promise<TokenResponse | undefined>;

    /**
     * Handles the user sign-in.
     * @param context - The turn context.
     * @param magicCode - The magic code from user sign-in.
     * @returns A promise that resolves to the token response or undefined if failed to verify the magic code.
     */
    public abstract handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined>;

    /**
     * Gets the login request for Adaptive Card authentication.
     * @param context - The turn context.
     * @returns A promise that resolves to the login request.
     */
    public abstract getLoginRequest(context: TurnContext): Promise<AdaptiveCardLoginRequest>;
}
