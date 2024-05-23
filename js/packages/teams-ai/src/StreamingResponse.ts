/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";

/**
 * A helper class for streaming responses to the client.
 */
export class StreamingResponse {
    private readonly _context: TurnContext;
    private _nextSequence: number = 1;
    private _streamId?: string;
    private _message: string = '';
    private _ended = false;

    /**
     * Creates a new StreamingResponse instance.
     * @param context Context for the current turn of conversation with the user.
     */
    public constructor(context: TurnContext) {
        this._context = context;
    }

    /**
     * Gets the stream ID of the current response.
     * @remarks
     * Assigned after the initial update is sent.
     */
    public get streamId(): string | undefined {
        return this._streamId;
    }

    /**
     * Gets the number of updates sent for the stream.
     */
    public get updatesSent(): number {
        return this._nextSequence - 1;
    }

    /**
     * Sends an informative update to the client.
     * @param text Text of the update to send.
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
     * @param text Partial text of the message to send.
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
     * @param text Partial text of the message to send.
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
     * @private
     */
    private async sendActivity(type: 'typing' | 'message', text: string, channelData: StreamingChannelData): Promise<void> {
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
 */
interface StreamingChannelData {
    streamType: 'informative' | 'streaming' | 'final';
    streamSequence: number;
    streamId?: string;
}