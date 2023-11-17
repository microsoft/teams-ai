import { ActivityTypes, InvokeResponse, TokenResponse, TurnContext } from 'botbuilder';
import * as UserTokenAccess from './UserTokenAccess';
import { AuthError, OAuthSettings } from './Authentication';
import { ACTION_INVOKE_NAME } from '../AdaptiveCards';
import { OAuthPromptSettings } from 'botbuilder-dialogs';

/**
 * @internal
 */
interface AdaptiveCardLoginInRequest {
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
 */
export class AdaptiveCardAuthentication {
    public async authenticate(context: TurnContext, settings: OAuthSettings): Promise<string | undefined> {
        const authObj = context.activity.value.authentication;

        // Token Exchange
        if (authObj && authObj.token) {
            // Message extension token exchange invoke activity
            const isTokenExchangable = await this.isTokenExchangeable(context, settings);
            if (!isTokenExchangable) {
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
            } else {
                const tokenExchangeResponse = await this.exchangeToken(context, settings);
                if (tokenExchangeResponse && tokenExchangeResponse.token) {
                    return tokenExchangeResponse.token;
                }
            }
        }

        const value = context.activity.value;

        // When the Bot Service Auth flow completes, the query.State will contain a magic code used for verification.
        const magicCode = value.state && Number.isInteger(Number(value.state)) ? value.state : '';

        const tokenResponse = await UserTokenAccess.getUserToken(context, settings, magicCode);

        if (this.isValidActivity(context) && (!tokenResponse || !tokenResponse.token)) {
            // There is no token, so the user has not signed in yet.
            // Retrieve the OAuth sign in link to use in the card.

            const signInResource = await UserTokenAccess.getSignInResource(context, settings);
            const signInLink = signInResource.signInLink;

            if (!signInLink) {
                throw new AuthError('OAuthPrompt Authentication failed. No signin link found.');
            }

            const response: AdaptiveCardLoginInRequest = {
                statusCode: 401,
                type: 'application/vnd.microsoft.activity.loginRequest',
                value: {
                    text: settings.title,
                    connectionName: settings.connectionName,
                    buttons: [
                        {
                            title: 'Sign-In',
                            text: 'Sign-In',
                            type: 'signin',
                            value: signInLink
                        }
                    ]
                }
            };

            if (settings.tokenExchangeUri) {
                const botId = context.activity.recipient.id;
                response.value.tokenExchangeResource = {
                    id: botId,
                    uri: settings.tokenExchangeUri
                };
            }

            // Queue up invoke response
            await context.sendActivity({
                value: { body: response, status: 200 } as InvokeResponse,
                type: ActivityTypes.InvokeResponse
            });

            return;
        }

        return tokenResponse.token;
    }

    public isValidActivity(context: TurnContext): boolean {
        return context.activity.type == ActivityTypes.Invoke && context.activity.name == ACTION_INVOKE_NAME;
    }

    public async isTokenExchangeable(context: TurnContext, settings: OAuthPromptSettings): Promise<boolean> {
        let tokenExchangeResponse;
        try {
            tokenExchangeResponse = await this.exchangeToken(context, settings);
        } catch (err) {
            // Ignore Exceptions
            // If token exchange failed for any reason, tokenExchangeResponse above stays null, and hence we send back a failure invoke response to the caller.
            console.log('tokenExchange error: ' + err);
        }
        if (!tokenExchangeResponse || !tokenExchangeResponse.token) {
            return false;
        }
        return true;
    }

    public async exchangeToken(
        context: TurnContext,
        settings: OAuthPromptSettings
    ): Promise<TokenResponse | undefined> {
        const tokenExchangeRequest = context.activity.value.authentication;

        if (!tokenExchangeRequest || !tokenExchangeRequest.token) {
            return;
        }

        return await UserTokenAccess.exchangeToken(context, settings, tokenExchangeRequest);
    }
}
