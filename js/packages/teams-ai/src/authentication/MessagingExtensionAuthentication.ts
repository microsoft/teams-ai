import { ActivityTypes, InvokeResponse, TokenResponse, TurnContext } from 'botbuilder';
import { DefaultTurnState } from '../DefaultTurnStateManager';
import { TurnState } from '../TurnState';
import { FETCH_TASK_INVOKE_NAME, QUERY_INVOKE_NAME, QUERY_LINK_INVOKE_NAME } from '../MessageExtensions';
import * as UserTokenAccess from './UserTokenAccess';
import { OAuthPromptSettings } from 'botbuilder-dialogs';

/**
 * @internal
 */
export class MessagingExtensionAuthentication<TState extends TurnState = DefaultTurnState> {
    private readonly _oauthPromptSettings: OAuthPromptSettings;

    public constructor(_oauthPromptSettings: OAuthPromptSettings) {
        this._oauthPromptSettings = _oauthPromptSettings;
    }

    public async authenticate(context: TurnContext, state: TState): Promise<string | undefined> {
        const authObj = context.activity.value.authentication;

        // Token Exchange
        if (authObj && authObj.token) {
            // Message extension token exchange invoke activity
            const isTokenExchangable = await this.isTokenExchangeable(context);
            if (!isTokenExchangable) {
                await context.sendActivity({
                    value: { status: 412 } as InvokeResponse,
                    type: ActivityTypes.InvokeResponse
                });

                return undefined;
            }
        }

        const value = context.activity.value;

        // When the Bot Service Auth flow completes, the query.State will contain a magic code used for verification.
        const magicCode = value.state && Number.isInteger(Number(value.state)) ? value.state : '';

        const tokenResponse = await UserTokenAccess.getUserToken(context, this._oauthPromptSettings, magicCode);

        if (!tokenResponse || !tokenResponse.token) {
            // There is no token, so the user has not signed in yet.
            // Retrieve the OAuth Sign in Link to use in the MessagingExtensionResult Suggested Actions

            const signInResource = await UserTokenAccess.getSignInResource(context, this._oauthPromptSettings);
            const signInLink = signInResource.signInLink;
            // Do 'silentAuth' if this is a composeExtension/query request otherwise do normal `auth` flow.
            const authType = context.activity.name === QUERY_INVOKE_NAME ? 'silentAuth' : 'auth';

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

        return tokenResponse.token;
    }

    public isValidActivity(context: TurnContext): boolean {
        return (
            context.activity.type == ActivityTypes.Invoke &&
            (context.activity.name == QUERY_INVOKE_NAME ||
                context.activity.name == FETCH_TASK_INVOKE_NAME ||
                context.activity.name == QUERY_LINK_INVOKE_NAME)
        );
    }

    public async isTokenExchangeable(context: TurnContext) {
        let tokenExchangeResponse;
        try {
            tokenExchangeResponse = await this.exchangeToken(context);
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

    public async exchangeToken(context: TurnContext): Promise<TokenResponse | undefined> {
        const tokenExchangeRequest = context.activity.value.authentication;

        if (!tokenExchangeRequest || !tokenExchangeRequest.token) {
            return;
        }

        return await UserTokenAccess.exchangeToken(context, this._oauthPromptSettings, tokenExchangeRequest);
    }
}
