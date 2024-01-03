import { ActivityTypes, InvokeResponse, TokenResponse, TurnContext } from 'botbuilder';
import { MessageExtensionsInvokeNames } from '../MessageExtensions';

/**
 * @internal
 * Base class to handle authentication for Teams Message Extension.
 */
export abstract class MessageExtensionAuthenticationBase {
    /**
     * Authenticates the user.
     * @param {TurnContext} context - The turn context.
     * @returns {Promise<string | undefined>} - The authentication token, or undefined if authentication failed. Teams will ask user to sign-in if authentication failed.
     */
    public async authenticate(context: TurnContext): Promise<string | undefined> {
        const value = context.activity.value;
        const tokenExchangeRequest = value.authentication;

        // Token Exchange, this happens when a silentAuth action is sent to Teams
        if (tokenExchangeRequest && tokenExchangeRequest.token) {
            // Message extension token exchange invoke activity
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
                value: { status: 412 } as InvokeResponse,
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

        // No auth/silentAuth action sent to Teams yet
        // Retrieve the OAuth Sign in Link to use in the MessageExtensionResult Suggested Actions

        const signInLink = await this.getSignInLink(context);
        // Do 'silentAuth' if this is a composeExtension/query request otherwise do normal `auth` flow.
        const authType = context.activity.name === MessageExtensionsInvokeNames.QUERY_INVOKE ? 'silentAuth' : 'auth';

        const response = {
            composeExtension: {
                type: authType,
                suggestedActions: {
                    actions: [
                        {
                            type: 'openUrl',
                            value: signInLink,
                            title: 'Bot Service OAuth'
                        }
                    ]
                }
            }
        };

        // Queue up invoke response
        await context.sendActivity({
            value: { body: response, status: 200 } as InvokeResponse,
            type: ActivityTypes.InvokeResponse
        });

        return;
    }

    /**
     * Checks if the activity is a valid Message Extension activity that supports authentication.
     * @param {TurnContext} context - The turn context.
     * @returns {boolean} - A boolean indicating if the activity is valid.
     */
    public isValidActivity(context: TurnContext): boolean {
        return (
            context.activity.type == ActivityTypes.Invoke &&
            (context.activity.name == MessageExtensionsInvokeNames.QUERY_INVOKE ||
                context.activity.name == MessageExtensionsInvokeNames.FETCH_TASK_INVOKE ||
                context.activity.name == MessageExtensionsInvokeNames.QUERY_LINK_INVOKE ||
                context.activity.name == MessageExtensionsInvokeNames.ANONYMOUS_QUERY_LINK_INVOKE)
        );
    }

    /**
     * Handles the SSO token exchange.
     * @param {TurnContext} context - The turn context.
     * @returns {Promise<TokenResponse | undefined>} - A promise that resolves to the token response or undefined if token exchange failed.
     */
    public abstract handleSsoTokenExchange(context: TurnContext): Promise<TokenResponse | undefined>;

    /**
     * Handles the user sign-in.
     * @param {TurnContext} context - The turn context.
     * @param {string} magicCode - The magic code from user sign-in.
     * @returns {Promise<TokenResponse | undefined>} - A promise that resolves to the token response or undefined if failed to verify the magic code.
     */
    public abstract handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined>;

    /**
     * Gets the sign-in link for the user.
     * @param {TurnContext} context - The turn context.
     * @returns {Promise<string | undefined>} - A promise that resolves to the sign-in link or undefined if no sign-in link available.
     */
    public abstract getSignInLink(context: TurnContext): Promise<string | undefined>;
}
