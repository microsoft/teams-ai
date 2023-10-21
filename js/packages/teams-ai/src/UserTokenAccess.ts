// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CloudAdapterBase, TokenResponse, TurnContext } from 'botbuilder-core';
import { OAuthPromptSettings } from 'botbuilder-dialogs';

import { SignInUrlResponse, TokenExchangeRequest, UserTokenClient } from 'botframework-connector';

/**
 * @internal
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
