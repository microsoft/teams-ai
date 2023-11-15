import { ActivityTypes, InvokeResponse, TokenResponse, TurnContext } from 'botbuilder';
import { MessagingExtensionsInvokeNames } from '../MessageExtensions';

/**
 * @internal
 */
export abstract class MessagingExtensionAuthenticationBase {
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
        // Retrieve the OAuth Sign in Link to use in the MessagingExtensionResult Suggested Actions

        const signInLink = await this.getSignInLink(context);
        // Do 'silentAuth' if this is a composeExtension/query request otherwise do normal `auth` flow.
        const authType = context.activity.name === MessagingExtensionsInvokeNames.QUERY_INVOKE ? 'silentAuth' : 'auth';

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

    public isValidActivity(context: TurnContext): boolean {
        return (
            context.activity.type == ActivityTypes.Invoke &&
            (context.activity.name == MessagingExtensionsInvokeNames.QUERY_INVOKE ||
                context.activity.name == MessagingExtensionsInvokeNames.FETCH_TASK_INVOKE ||
                context.activity.name == MessagingExtensionsInvokeNames.QUERY_LINK_INVOKE ||
                context.activity.name == MessagingExtensionsInvokeNames.ANONYMOUS_QUERY_LINK_INVOKE)
        );
    }

    public abstract handleSsoTokenExchange(
        context: TurnContext
    ): Promise<TokenResponse | undefined>

    public abstract handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined>

    public abstract getSignInLink(context: TurnContext): Promise<string | undefined>
}
