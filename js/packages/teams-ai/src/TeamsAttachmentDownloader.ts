/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios, { AxiosInstance } from 'axios';
import { Attachment, TurnContext } from 'botbuilder';
import { AppCredentials, AuthenticationConstants, GovernmentConstants } from 'botframework-connector';

import { InputFile, InputFileDownloader } from './InputFileDownloader';
import { TeamsAdapter } from './TeamsAdapter';
import { TurnState } from './TurnState';

/**
 * Options for the `TeamsAttachmentDownloader` class.
 */
export interface TeamsAttachmentDownloaderOptions {
    /**
     * The Microsoft App ID of the bot.
     */
    botAppId: string;

    /**
     * ServiceClientCredentialsFactory
     */
    adapter: TeamsAdapter;
}

export interface AuthenticatorResult {
    /**
     * The value of the access token resulting from an authentication process.
     */
    accessToken: string;
    /**
     *  The date and time of expiration relative to Coordinated Universal Time (UTC).
     */
    expiresOn: Date;
}
/**
 * Downloads attachments from Teams using the bots access token.
 */
export class TeamsAttachmentDownloader<TState extends TurnState = TurnState> implements InputFileDownloader<TState> {
    private readonly _options: TeamsAttachmentDownloaderOptions;
    private _httpClient: AxiosInstance;

    /**
     * Creates a new instance of the `TeamsAttachmentDownloader` class.
     * @param {TeamsAttachmentDownloader} options - Options for the `TeamsAttachmentDownloader` class.
     */
    public constructor(options: TeamsAttachmentDownloaderOptions) {
        this._options = options;
        this._httpClient = axios.create();
    }

    /**
     * Download any files relative to the current user's input.
     * @template TState - Type of the state object passed to the `TurnContext.turnState` method.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {TState} state Application state for the current turn of conversation.
     * @returns {Promise<InputFile[]>} Promise that resolves to an array of downloaded input files.
     */
    public async downloadFiles(context: TurnContext, state: TState): Promise<InputFile[]> {
        // Filter out HTML attachments
        const attachments = context.activity.attachments?.filter((a) => !a.contentType.startsWith('text/html'));
        if (!attachments || attachments.length === 0) {
            return Promise.resolve([]);
        }

        let accessToken = '';

        // If authentication is enabled, get access token
        if ((await this._options.adapter.credentialsFactory?.isAuthenticationDisabled()) !== true) {
            // Download all attachments
            accessToken = await this.getAccessToken();
        }
        const files: InputFile[] = [];
        for (const attachment of attachments) {
            const file = await this.downloadFile(attachment, accessToken);
            if (file) {
                files.push(file);
            }
        }

        return files;
    }

    /**
     * @private
     * @param {Attachment} attachment - Attachment to download.
     * @param {string} accessToken - Access token to use for downloading.
     * @returns {Promise<InputFile>} - Promise that resolves to the downloaded input file.
     */
    private async downloadFile(attachment: Attachment, accessToken: string): Promise<InputFile | undefined> {
        if (attachment.content) {
            return {
                content: Buffer.from(attachment.content),
                contentType: attachment.contentType,
                contentUrl: attachment.contentUrl
            };
        } else if (
            (attachment.contentUrl && attachment.contentUrl.startsWith('https://')) ||
            (attachment.contentUrl && attachment.contentUrl.startsWith('http://localhost'))
        ) {
            let headers;
            if (accessToken.length > 0) {
                // Build request for downloading file if access token is available
                headers = {
                    Authorization: `Bearer ${accessToken}`
                };
            }
            const response = await this._httpClient.get(attachment.contentUrl, {
                headers,
                responseType: 'arraybuffer'
            });

            // Convert to a buffer
            const content = Buffer.from(response.data, 'binary');

            // Fixup content type
            let contentType = attachment.contentType;
            if (contentType === 'image/*') {
                contentType = 'image/png';
            }

            // Return file
            return {
                content,
                contentType,
                contentUrl: attachment.contentUrl
            };
        }
    }

    /**
     * @private
     * @returns {Promise<string>} - Promise that resolves to the access token.
     */
    private async getAccessToken(): Promise<string> {
        // Normalize the ToChannelFromBotLoginUrl (and use a default value when it is undefined).
        const toChannelFromBotLoginUrl = (
            this._options.adapter.botFrameworkAuthConfig?.ToChannelFromBotLoginUrl ||
            AuthenticationConstants.ToChannelFromBotLoginUrlPrefix + AuthenticationConstants.DefaultChannelAuthTenant
        ).toLowerCase();

        let audience = this._options.adapter.botFrameworkAuthConfig?.ToChannelFromBotOAuthScope;
        const loginEndpoint = toChannelFromBotLoginUrl;

        // If there is no loginEndpoint set on the provided ConfigurationBotFrameworkAuthenticationOptions, or it starts with 'https://login.microsoftonline.com/', the bot is operating in Public Azure.
        // So we use the Public Azure audience or the specified audience.
        if (loginEndpoint.startsWith(AuthenticationConstants.ToChannelFromBotLoginUrlPrefix)) {
            audience = audience ?? AuthenticationConstants.ToChannelFromBotOAuthScope;
        } else if (toChannelFromBotLoginUrl === GovernmentConstants.ToChannelFromBotLoginUrl) {
            // Or if the bot is operating in US Government Azure, use that audience.
            audience = audience ?? GovernmentConstants.ToChannelFromBotOAuthScope;
        }

        const appCreds = (await this._options.adapter.credentialsFactory.createCredentials(
            this._options.botAppId,
            audience,
            loginEndpoint,
            true
        )) as AppCredentials;

        return appCreds.getToken();
    }
}
