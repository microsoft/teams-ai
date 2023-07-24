/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Constants used to populate the Activity.callerId property.
 */
export class CallerIdConstants {
    /**
     * The caller ID for any Bot Framework channel.
     */
    static readonly PublicAzureChannel: string = 'urn:botframework:azure';

    /**
     * The caller ID for any Bot Framework US Government cloud channel.
     */
    static readonly USGovChannel: string = 'urn:botframework:azureusgov';

    /**
     * The caller ID prefix when a bot initiates a request to another bot.
     *
     * @remarks
     * This prefix will be followed by the Azure Active Directory App ID of the bot that initiated the call.
     */
    static readonly BotToBotPrefix: string = 'urn:botframework:aadappid:';
}
