/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

/**
 * A helper class for streaming responses to the client.
 * @remarks
 * This class is used to send a series of updates to the client in a single response. The expected
 * sequence of calls is:
 *
 * `sendInformativeUpdate()`, `sendTextChunk()`, `sendTextChunk()`, ..., `endStream()`.
 *
 * Once `endStream()` is called, the stream is considered ended and no further updates can be sent.
 */
export class StreamingResponse {
    private readonly _context: TurnContext;
    private _nextSequence: number = 1;
    private _streamId?: string;
    private _message: string = '';
    private _ended = false;

    /**
     * Creates a new StreamingResponse instance.
     * @param {TurnContext} context - Context for the current turn of conversation with the user.
     * @returns {TurnContext} - The context for the current turn of conversation with the user.
     */
    public constructor(context: TurnContext) {
        this._context = context;
    }

    /**
     * Gets the stream ID of the current response.
     * @returns {string | undefined} - The stream ID of the current response.
     * @remarks
     * Assigned after the initial update is sent.
     */
    public get streamId(): string | undefined {
        return this._streamId;
    }

    /**
     * Gets the number of updates sent for the stream.
     * @returns {number} - The number of updates sent for the stream.
     */
    public get updatesSent(): number {
        return this._nextSequence - 1;
    }

    /**
     * Sends an informative update to the client.
     * @param {string} text Text of the update to send.
     * @returns {Promise<void>} - A promise representing the async operation.
     */
    public sendInformativeUpdate(text: string): Promise<void> {
        if (this._ended) {
            throw new Error('The stream has already ended.');
        }

        // Send typing activity
        return this.sendActivity('typing', text, {
            streamType: 'informative',
            streamSequence: this._nextSequence++
        });
    }

    /**
     * Sends a chunk of partial message text to the client.
     * @remarks
     * The text is appended to the full message text which will be sent when endStream() is called.
     * @param {string} text Partial text of the message to send.
     * @returns {Promise<void>} - A promise representing the async operation
     */
    public sendTextChunk(text: string): Promise<void> {
        if (this._ended) {
            throw new Error('The stream has already ended.');
        }

        // Update full message text
        this._message += text;

        // Send typing activity
        return this.sendActivity('typing', text, {
            streamType: 'streaming',
            streamSequence: this._nextSequence++
        });
    }

    /**
     * Ends the stream by sending the final message to the client.
     * @returns {Promise<void>} - A promise representing the async operation
     */
    public endStream(): Promise<void> {
        if (this._ended) {
            throw new Error('The stream has already ended.');
        }

        // Send final message
        this._ended = true;
        return this.sendActivity('message', this._message, {
            streamType: 'final',
            streamSequence: this._nextSequence++
        });
    }

    /**
     * @param {'typing' | 'message'} type - The type of activity to send.
     * @param {string} text - The text of the activity to send.
     * @param {StreamingChannelData} channelData - The channel data for the activity to send.
     * @returns {Promise<void>} - A promise representing the async operation.
     * @private
     */
    private async sendActivity(
        type: 'typing' | 'message',
        text: string,
        channelData: StreamingChannelData
    ): Promise<void> {
        // Add stream ID
        if (this._streamId) {
            channelData.streamId = this._streamId;
        }

        // Send activity
        const response = await this._context.sendActivity({
            type,
            text,
            channelData
        });

        // Save stream ID
        if (!this._streamId) {
            this._streamId = response?.id;
        }
    }
}

/**
 * @private
 * Structure of the outgoing channelData field for streaming responses.
 * @remarks
 * The expected sequence of streamTypes is:
 *
 * `informative`, `streaming`, `streaming`, ..., `final`.
 *
 * Once a `final` message is sent, the stream is considered ended.
 */
interface StreamingChannelData {
    /**
     * The type of message being sent.
     * @remarks
     * `informative` - An informative update.
     * `streaming` - A chunk of partial message text.
     * `final` - The final message.
     */
    streamType: 'informative' | 'streaming' | 'final';

    /**
     * Sequence number of the message in the stream.
     * @remarks
     * Starts at 1 for the first message and increments from there.
     */
    streamSequence: number;

    /**
     * ID of the stream.
     * @remarks
     * Assigned after the initial update is sent.
     */
    streamId?: string;
}
