// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TokenResponse, TurnContext } from 'botbuilder';
import { OAuthPromptSettings } from 'botbuilder-dialogs';
import { MessageExtensionAuthenticationBase } from './MessageExtensionAuthenticationBase';
import * as UserTokenAccess from './UserTokenAccess';

export class OAuthPromptMessageExtensionAuthentication extends MessageExtensionAuthenticationBase {
    public constructor(private readonly settings: OAuthPromptSettings) {
        super();
    }

    public async handleSsoTokenExchange(context: TurnContext): Promise<TokenResponse | undefined> {
        const tokenExchangeRequest = context.activity.value.authentication;

        if (!tokenExchangeRequest || !tokenExchangeRequest.token) {
            return;
        }

        return await UserTokenAccess.exchangeToken(context, this.settings, tokenExchangeRequest);
    }

    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        return await UserTokenAccess.getUserToken(context, this.settings, magicCode);
    }

    public async getSignInLink(context: TurnContext): Promise<string | undefined> {
        const signInResource = await UserTokenAccess.getSignInResource(context, this.settings);
        return signInResource.signInLink;
    }
}
