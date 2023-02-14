/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnState } from './TurnState';

export class ConversationHistory {
    /**
     * Name of the conversation state property used to hold the list of entires.
     */
    public static readonly StatePropertyName = '__history__';

    /**
     * Adds a new line of text to conversation history
     *
     * @param state Applications turn state.
     * @param line Line of text to add to history.
     * @param maxLines Optional. Maximum number of lines to store. Defaults to 30.
     */
    public static addLine(state: TurnState, line: string, maxLines = 30): void {
        if (state.conversation) {
            // Create history array if it doesn't exist
            let history: string[] = state.conversation.value[ConversationHistory.StatePropertyName];
            if (!Array.isArray(history)) {
                history = [];
            }

            // Add line to history
            history.push(line);

            // Prune history if too long
            if (history.length > maxLines) {
                history.splice(0, history.length - maxLines);
            }

            // Save history back to conversation state
            state.conversation.value[ConversationHistory.StatePropertyName] = history;
        } else {
            throw new Error(
                `ConversationHistory.addLine() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    public static appendToLastLine(state: TurnState, text: string): void {
        const line = ConversationHistory.getLastLine(state);
        ConversationHistory.replaceLastLine(state, line + text);
    }

    public static getLastLine(state: TurnState): string {
        if (state.conversation) {
            // Create history array if it doesn't exist
            let history: string[] = state.conversation.value[ConversationHistory.StatePropertyName];
            if (!Array.isArray(history)) {
                history = [];
            }

            // Return the last line or an empty string
            return history.length > 0 ? history[history.length - 1] : '';
        } else {
            throw new Error(
                `ConversationHistory.getLastLine() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    public static removeLastLine(state: TurnState): string | undefined {
        if (state.conversation) {
            // Create history array if it doesn't exist
            let history: string[] = state.conversation.value[ConversationHistory.StatePropertyName];
            if (!Array.isArray(history)) {
                history = [];
            }

            // Remove last line
            // - undefined is returned if the array is empty
            const line = history.pop();

            // Save history back to conversation state
            state.conversation.value[ConversationHistory.StatePropertyName] = history;

            // Return removed line
            return line;
        } else {
            throw new Error(
                `ConversationHistory.removeLastLine() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    public static replaceLastLine(state: TurnState, line: string): void {
        if (state.conversation) {
            // Create history array if it doesn't exist
            let history: string[] = state.conversation.value[ConversationHistory.StatePropertyName];
            if (!Array.isArray(history)) {
                history = [];
            }

            // Replace the last line or add a new one
            if (history.length > 0) {
                history[history.length - 1] = line;
            } else {
                history.push(line);
            }

            // Save history back to conversation state
            state.conversation.value[ConversationHistory.StatePropertyName] = history;
        } else {
            throw new Error(
                `ConversationHistory.replaceLastLine() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    /**
     * Returns the current conversation history as a string of text.
     *
     * @remarks
     * The length of the returned text is gated by `maxCharacterLength` and only whole lines of
     * history entries will be returned. That means that if the length of the most recent history
     * entry is greater then `maxCharacterLength` no text will be returned.
     * @param state Applications turn state.
     * @param maxCharacterLength Optional. Maximum length of the text returned. Defaults to 4000 characters.
     * @param lineSeparator Optional. Separate used between lines. Defaults to '\n'.
     * @returns The most recent lines of conversation history as a text string.
     */
    public static toString(state: TurnState, maxCharacterLength = 4000, lineSeparator = '\n'): string {
        if (state.conversation) {
            // Get history array if it exists
            const history: string[] = state.conversation.value[ConversationHistory.StatePropertyName] ?? [];

            // Populate up to max chars
            let text = '';
            for (let i = history.length - 1; i >= 0; i--) {
                // Ensure that adding line won't go over the max character length
                const line = history[i];
                if (text.length + line.length + lineSeparator.length > maxCharacterLength) {
                    break;
                }

                // Prepend line to output
                text = `${line}${lineSeparator}${text}`;
            }

            return text.trim();
        } else {
            throw new Error(
                `ConversationHistory.toString() was passed a state object without a 'conversation' state member.`
            );
        }
    }
}
