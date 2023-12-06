/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { TurnState } from './TurnState';

/**
 * A plugin responsible for downloading files relative to the current user's input.
 * @template TState Optional. Type of application state.
 */
export interface InputFileDownloader<TState extends TurnState = TurnState> {
    /**
     * Download any files relative to the current users input.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     */
    downloadFiles(context: TurnContext, state: TState): Promise<InputFile[]>;
}

/**
 * A file sent by the user to the bot.
 */
export interface InputFile {
    /**
     * The downloaded content of the file.
     */
    content: Buffer;

    /**
     * The content type of the file.
     */
    contentType: string;

    /**
     * Optional. URL to the content of the file.
     */
    contentUrl?: string;
}
