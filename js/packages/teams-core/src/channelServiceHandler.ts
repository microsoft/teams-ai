// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ChannelServiceHandlerBase } from './channelServiceHandlerBase';
import { StatusCodeError } from './statusCodeError';
import { StatusCodes } from '@microsoft/teams-connector/src/schema';

import {
    AuthenticationConfiguration,
    AuthenticationConstants,
    ClaimsIdentity,
    ICredentialProvider,
    JwtTokenValidation,
    SkillValidation,
} from '@microsoft/teams-connector';

/**
 * @deprecated Use `CloudChannelServiceHandler` instead.
 * The ChannelServiceHandler implements API to forward activity to a skill and
 * implements routing ChannelAPI calls from the Skill up through the bot/adapter.
 */
export class ChannelServiceHandler extends ChannelServiceHandlerBase {
    /**
     * Initializes a new instance of the ChannelServiceHandler class, using a credential provider.
     *
     * @param credentialProvider The credential provider.
     * @param authConfig The authentication configuration.
     * @param channelService A string representing the channel provider.
     */
    constructor(
        private readonly credentialProvider: ICredentialProvider,
        private readonly authConfig: AuthenticationConfiguration,
        protected readonly channelService = process.env[AuthenticationConstants.ChannelService]
    ) {
        super();

        if (!credentialProvider) {
            throw new Error('ChannelServiceHandler(): missing credentialProvider');
        }
        if (!authConfig) {
            throw new Error('ChannelServiceHandler(): missing authConfig');
        }
    }

    protected async authenticate(authHeader: string): Promise<ClaimsIdentity> {
        if (!authHeader) {
            const isAuthDisabled = await this.credentialProvider.isAuthenticationDisabled();
            if (!isAuthDisabled) {
                throw new StatusCodeError(StatusCodes.UNAUTHORIZED);
            }

            // In the scenario where Auth is disabled, we still want to have the
            // IsAuthenticated flag set in the ClaimsIdentity. To do this requires
            // adding in an empty claim.
            // Since ChannelServiceHandler calls are always a skill callback call, we set the skill claim too.
            return SkillValidation.createAnonymousSkillClaim();
        }

        return JwtTokenValidation.validateAuthHeader(
            authHeader,
            this.credentialProvider,
            this.channelService!,
            'unknown',
            undefined,
            this.authConfig
        );
    }
}
