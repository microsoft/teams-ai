/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios, { AxiosInstance } from 'axios';
import { Attachment, TurnContext } from 'botbuilder';

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
     * The Microsoft App Password of the bot.
     */
    botAppPassword: string;

    /**
     * ServiceClientCredentialsFactory
     */
    adapter: TeamsAdapter;
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
        // await this._options.adapter.credentialsFactory
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const body = `grant_type=client_credentials&client_id=${encodeURI(
            this._options.botAppId
        )}&client_secret=${encodeURI(
            this._options.botAppPassword
        )}&scope=https%3A%2F%2Fapi.botframework.com%2F.default`;
        const token = await this._httpClient.post<JWTToken>(
            'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
            body,
            { headers }
        );
        return token.data.access_token;
    }
}

/**
 * @private
 */
interface JWTToken {
    token_type: string;
    expires_in: number;
    ext_expires_in: number;
    access_token: string;
}
