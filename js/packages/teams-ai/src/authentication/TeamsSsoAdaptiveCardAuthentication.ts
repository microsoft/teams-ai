// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TurnContext } from "botbuilder-core";
import { TokenResponse } from "botframework-schema";
import { AdaptiveCardAuthenticationBase, AdaptiveCardLoginRequest } from "./AdaptiveCardAuthenticationBase";

export class TeamsSsoAdaptiveCardAuthentication extends AdaptiveCardAuthenticationBase {
    public constructor() {
        super();
    }

    public async handleSsoTokenExchange(): Promise<never> {
        throw new Error('Not implemented');
    }
    
    public async handleUserSignIn(context: TurnContext, magicCode: string): Promise<TokenResponse | undefined> {
        throw new Error('Not implemented');
    }

    public async getLoginRequest(context: TurnContext): Promise<AdaptiveCardLoginRequest> {
        throw new Error('Not implemented');
    }

    public override isValidActivity(context: TurnContext): boolean {
        if (super.isValidActivity(context)) {
            console.warn("TeamsSsoSetting does not support Adaptive Card authentication yet. Please use OAuthSetting instead.")
        }
        return false;
    }
}