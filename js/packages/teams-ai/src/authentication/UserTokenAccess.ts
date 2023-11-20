// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CloudAdapterBase, TokenResponse, TurnContext } from 'botbuilder-core';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { SignInUrlResponse, TokenExchangeRequest, UserTokenClient } from 'botframework-connector';

/**
 * @internal
 * @private
 * Retrieves the user token for a given connection name and magic code.
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {OAuthPromptSettings} settings The settings for the OAuth prompt.
 * @param {string} magicCode The magic code to use for token retrieval.
 * @returns {Promise<TokenResponse>} A TokenResponse object containing the user token.
 */
export async function getUserToken(
    context: TurnContext,
    settings: OAuthPromptSettings,
    magicCode: string
): Promise<TokenResponse> {
    const userTokenClient = context.turnState.get<UserTokenClient>(
        (context.adapter as CloudAdapterBase).UserTokenClientKey
    );
    if (userTokenClient) {
        return userTokenClient.getUserToken(
            context.activity?.from?.id,
            settings.connectionName,
            context.activity?.channelId,
            magicCode
        );
    } else {
        throw new Error('OAuth prompt is not supported by the current adapter');
    }
}

/**
 * @internal
 * @private
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {OAuthPromptSettings} settings The settings for the OAuth prompt.
 * @returns {Promise<SignInUrlResponse>} A SignInUrlResponse object containing the sign-in URL.
 */
export async function getSignInResource(
    context: TurnContext,
    settings: OAuthPromptSettings
): Promise<SignInUrlResponse> {
    const userTokenClient = context.turnState.get<UserTokenClient>(
        (context.adapter as CloudAdapterBase).UserTokenClientKey
    );
    if (userTokenClient) {
        return userTokenClient.getSignInResource(settings.connectionName, context.activity, '');
    } else {
        throw new Error('OAuth prompt is not supported by the current adapter');
    }
}

/**
 * @internal
 * @private
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {OAuthPromptSettings} settings The settings for the OAuth prompt.
 */
export async function signOutUser(context: TurnContext, settings: OAuthPromptSettings): Promise<void> {
    const userTokenClient = context.turnState.get<UserTokenClient>(
        (context.adapter as CloudAdapterBase).UserTokenClientKey
    );
    if (userTokenClient) {
        await userTokenClient.signOutUser(
            context.activity?.from?.id,
            settings.connectionName,
            context.activity?.channelId
        );
    } else {
        throw new Error('OAuth prompt is not supported by the current adapter');
    }
}

/**
 * @internal
 * @private
 * @param {TurnContext} context The context object for the current turn of conversation.
 * @param {OAuthPromptSettings} settings The settings for the OAuth prompt.
 * @param {TokenExchangeRequest} tokenExchangeRequest The token exchange request details to be sent to the Bot Framework Token Service.
 * @returns {Promise<TokenResponse>} A TokenResponse object containing the user token.
 */
export async function exchangeToken(
    context: TurnContext,
    settings: OAuthPromptSettings,
    tokenExchangeRequest: TokenExchangeRequest
): Promise<TokenResponse> {
    const userTokenClient = context.turnState.get<UserTokenClient>(
        (context.adapter as CloudAdapterBase).UserTokenClientKey
    );
    if (userTokenClient) {
        return userTokenClient.exchangeToken(
            context.activity?.from?.id,
            settings.connectionName,
            context.activity?.channelId,
            tokenExchangeRequest
        );
    } else {
        throw new Error('OAuth prompt is not supported by the current adapter');
    }
}
