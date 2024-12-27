/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity, Attachment, TurnContext, Entity } from 'botbuilder-core';
import { AIEntity, ClientCitation, SensitivityUsageInfo } from './types';
import { Citation } from './prompts/Message';
import { Utilities } from './Utilities';

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
    private _attachments?: Attachment[];
    private _ended = false;

    // Queue for outgoing activities
    private _queue: Array<() => Partial<Activity>> = [];
    private _queueSync: Promise<void> | undefined;
    private _chunkQueued = false;

    // Powered by AI feature flags
    private _enableFeedbackLoop = false;
    private _enableGeneratedByAILabel = false;
    private _citations?: ClientCitation[] = [];
    private _sensitivityLabel?: SensitivityUsageInfo;

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
     * Gets the citations of the current response.
     */
    public get citations(): ClientCitation[] | undefined {
        return this._citations;
    }

    /**
     * Gets the number of updates sent for the stream.
     * @returns {number} - The number of updates sent for the stream.
     */
    public get updatesSent(): number {
        return this._nextSequence - 1;
    }

    /**
     * Queues an informative update to be sent to the client.
     * @param {string} text Text of the update to send.
     */
    public queueInformativeUpdate(text: string): void {
        if (this._ended) {
            throw new Error('The stream has already ended.');
        }

        // Queue a typing activity
        this.queueActivity(() => ({
            type: 'typing',
            text,
            channelData: {
                streamType: 'informative',
                streamSequence: this._nextSequence++
            } as StreamingChannelData
        }));
    }

    /**
     * Queues a chunk of partial message text to be sent to the client
     * @remarks
     * The text we be sent as quickly as possible to the client. Chunks may be combined before
     * delivery to the client.
     * @param {string} text Partial text of the message to send.
     * @param {Citation[]} citations Citations to be included in the message.
     */
    public queueTextChunk(text: string, citations?: Citation[]): void {
        if (this._ended) {
            throw new Error('The stream has already ended.');
        }

        // Update full message text
        this._message += text;

        if (citations && citations.length > 0) {
            if (!this._citations) {
                this._citations = [];
            }
            let currPos = this._citations.length;

            for (const citation of citations) {
                const clientCitation: ClientCitation = {
                    '@type': 'Claim',
                    position: currPos + 1,
                    appearance: {
                        '@type': 'DigitalDocument',
                        name: citation.title || `Document #${currPos + 1}`,
                        abstract: Utilities.snippet(citation.content, 477)
                    }
                };
                currPos++;
                this._citations.push(clientCitation);
            }

            // If there are citations, modify the content so that the sources are numbers instead of [doc1], [doc2], etc.
            this._message =
                this._citations.length == 0 ? this._message : Utilities.formatCitationsResponse(this._message);

            // If there are citations, filter out the citations unused in content.
            this._citations = Utilities.getUsedCitations(this._message, this._citations) ?? undefined;
        }

        // Queue the next chunk
        this.queueNextChunk();
    }

    /**
     * Ends the stream by sending the final message to the client.
     * @returns {Promise<void>} - A promise representing the async operation
     */
    public endStream(): Promise<void> {
        if (this._ended) {
            throw new Error('The stream has already ended.');
        }

        // Queue final message
        this._ended = true;
        this.queueNextChunk();

        // Wait for the queue to drain
        return this.waitForQueue();
    }

    /**
     * Sets the attachments to attach to the final chunk.
     * @param attachments List of attachments.
     */
    public setAttachments(attachments: Attachment[]): void {
        this._attachments = attachments;
    }

    /**
     * Sets the sensitivity label to attach to the final chunk.
     * @param sensitivityLabel The sensitivty label.
     */
    public setSensitivityLabel(sensitivityLabel: SensitivityUsageInfo): void {
        this._sensitivityLabel = sensitivityLabel;
    }

    /**
     * Sets the Feedback Loop in Teams that allows a user to
     * give thumbs up or down to a response.
     * Default is `false`.
     * @param enableFeedbackLoop If true, the feedback loop is enabled.
     */
    public setFeedbackLoop(enableFeedbackLoop: boolean): void {
        this._enableFeedbackLoop = enableFeedbackLoop;
    }

    /**
     * Sets the the Generated by AI label in Teams
     * Default is `false`.
     * @param enableGeneratedByAILabel If true, the label is added.
     */
    public setGeneratedByAILabel(enableGeneratedByAILabel: boolean): void {
        this._enableGeneratedByAILabel = enableGeneratedByAILabel;
    }

    /**
     * Returns the most recently streamed message.
     * @returns The streamed message.
     */
    public getMessage(): string {
        return this._message;
    }

    /**
     * Waits for the outgoing activity queue to be empty.
     * @returns {Promise<void>} - A promise representing the async operation.
     */
    public waitForQueue(): Promise<void> {
        return this._queueSync || Promise.resolve();
    }

    /**
     * Queues the next chunk of text to be sent to the client.
     * @private
     */
    private queueNextChunk(): void {
        // Are we already waiting to send a chunk?
        if (this._chunkQueued) {
            return;
        }

        // Queue a chunk of text to be sent
        this._chunkQueued = true;
        this.queueActivity(() => {
            this._chunkQueued = false;
            if (this._ended) {
                // Send final message
                return {
                    type: 'message',
                    text: this._message,
                    attachments: this._attachments,
                    channelData: {
                        streamType: 'final'
                    } as StreamingChannelData
                };
            } else {
                // Send typing activity
                return {
                    type: 'typing',
                    text: this._message,
                    channelData: {
                        streamType: 'streaming',
                        streamSequence: this._nextSequence++
                    } as StreamingChannelData
                };
            }
        });
    }

    /**
     * Queues an activity to be sent to the client.
     * @param {() => Partial<Activity>} factory - A factory that creates the outgoing activity just before its sent.
     */
    private queueActivity(factory: () => Partial<Activity>): void {
        this._queue.push(factory);

        // If there's no sync in progress, start one
        if (!this._queueSync) {
            this._queueSync = this.drainQueue().catch((err) => {
                console.error(`Error occured when sending activity while streaming: "${err}".`);
                throw err;
            });
        }
    }

    /**
     * Sends any queued activities to the client until the queue is empty.
     * @returns {Promise<void>} - A promise that will be resolved once the queue is empty.
     * @private
     */
    private drainQueue(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                while (this._queue.length > 0) {
                    // Get next activity from queue
                    const factory = this._queue.shift()!;
                    const activity = factory();

                    // Send activity
                    await this.sendActivity(activity);
                }

                resolve();
            } catch (err) {
                reject(err);
            } finally {
                // Queue is empty, mark as idle
                this._queueSync = undefined;
            }
        });
    }

    /**
     * Sends an activity to the client and saves the stream ID returned.
     * @param {Partial<Activity>} activity - The activity to send.
     * @returns {Promise<void>} - A promise representing the async operation.
     * @private
     */
    private async sendActivity(activity: Partial<Activity>): Promise<void> {
        // Set activity ID to the assigned stream ID
        if (this._streamId) {
            activity.id = this._streamId;
            activity.channelData = Object.assign({}, activity.channelData, { streamId: this._streamId });
        }

        activity.entities = [
            {
                type: 'streaminfo',
                ...activity.channelData
            } as Entity
        ];

        // Add in Powered by AI feature flags
        if (this._ended) {
            // Add in feedback loop
            activity.channelData = Object.assign({}, activity.channelData, {
                feedbackLoopEnabled: this._enableFeedbackLoop
            });

            // Add in Generated by AI
            if (this._enableGeneratedByAILabel) {
                activity.entities.push({
                    type: 'https://schema.org/Message',
                    '@type': 'Message',
                    '@context': 'https://schema.org',
                    '@id': '',
                    additionalType: ['AIGeneratedContent'],
                    citation: this._citations && this._citations.length > 0 ? this._citations : [],
                    usageInfo: this._sensitivityLabel
                } as AIEntity);
            }
        }

        // Send activity
        const response = await this._context.sendActivity(activity);
        await new Promise((resolve) => setTimeout(resolve, 1.5));

        // Save assigned stream ID
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
