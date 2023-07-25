// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { BotFrameworkAuthentication, ClaimsIdentity } from '@microsoft/teams-connector';
import { ChannelServiceHandlerBase } from './channelServiceHandlerBase';

/**
 * A class to help with the implementation of the Bot Framework protocol using [BotFrameworkAuthentication](xref:botframework-connector.BotFrameworkAuthentication).
 */
export class CloudChannelServiceHandler extends ChannelServiceHandlerBase {
    /**
     * @param auth Bot framework authentication
     */
    constructor(private readonly auth: BotFrameworkAuthentication) {
        super();
    }

    protected async authenticate(authHeader: string): Promise<ClaimsIdentity> {
        return this.auth.authenticateChannelRequest(authHeader);
    }
}
