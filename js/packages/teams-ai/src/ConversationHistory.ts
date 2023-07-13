/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// TODO:
/* eslint-disable security/detect-object-injection */
import { encode } from 'gpt-3-encoder';
import { TurnState } from './TurnState';

/**
 * Utility class used to manage the persistance of conversation history.
 */
export class ConversationHistory {
    /**
     * Name of the conversation state property used to hold the list of entires.
     */
    public static readonly StatePropertyName = '__history__';

    /**
     * Adds a new line of text to conversation history
     * @param {TurnState} state Applications turn state.
     * @param {string} line Line of text to add to history.
     * @param {number} maxLines Optional. Maximum number of lines to store. Defaults to 10.
     */
    public static addLine(state: TurnState, line: string, maxLines = 10): void {
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

    /**
     * Appends additional text to the last line of conversation history.
     * @param {TurnState} state Applications turn state.
     * @param {string} text Text to add to the last line.
     */
    public static appendToLastLine(state: TurnState, text: string): void {
        const line = ConversationHistory.getLastLine(state);
        ConversationHistory.replaceLastLine(state, line + text);
    }

    /**
     * Clears all conversation history for the current conversation.
     * @param {TurnState} state Applications turn state.
     */
    public static clear(state: TurnState): void {
        if (state.conversation) {
            state.conversation.value[ConversationHistory.StatePropertyName] = [];
        } else {
            throw new Error(
                `ConversationHistory.clear() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    /**
     * Checks to see if one or more lines of history has persisted.
     * @param {TurnState} state Applications turn state.
     * @returns {boolean} True if there are 1 or more lines of history.
     */
    public static hasMoreLines(state: TurnState): boolean {
        if (state.conversation) {
            const history: string[] = state.conversation.value[ConversationHistory.StatePropertyName];
            return Array.isArray(history) ? history.length > 0 : false;
        } else {
            throw new Error(
                `ConversationHistory.hasMoreLines() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    /**
     * Returns the last line of history.
     * @param {TurnState} state Applications turn state.
     * @returns {string} The last line of history or an empty string.
     */
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

    /**
     * Searches the history to find the last SAY response from the assistant.
     * @param {TurnState} state Applications turn state.
     * @returns {string} Last thing said by the assistant. Defaults to an empty string.
     */
    public static getLastSay(state: TurnState): string {
        // Find start of text
        const lastLine = this.getLastLine(state);
        let textPos = lastLine.lastIndexOf(' SAY ');
        if (textPos >= 0) {
            textPos += 5;
        } else {
            // Find end of prefix
            textPos = lastLine.indexOf(': ');
            if (textPos >= 0) {
                textPos += 2;
            } else {
                // Just use whole text
                textPos = 0;
            }
        }

        // Trim off any DO statements
        let text = lastLine.substring(textPos);
        let doPos = text.indexOf(' THEN DO ');
        if (doPos >= 0) {
            text = text.substring(0, doPos);
        } else {
            doPos = text.indexOf(' DO ');
            if (doPos >= 0) {
                text = text.substring(0, doPos);
            }
        }

        return text.indexOf('DO ') < 0 ? text.trim() : '';
    }

    /**
     * Removes the last line from the conversation history.
     * @param {TurnState} state Applications turn state.
     * @returns {string | undefined} The removed line or undefined.
     */
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

    /**
     * Replaces the last line of history with a new line.
     * @param {TurnState} state Applications turn state.
     * @param {string} line New line of history.
     */
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
     * Replaces the last SAY with a new response.
     * @param {TurnState} state Applications turn state.
     * @param {string} newResponse New response from the assistant.
     * @param {string} assistantPrefix Prefix for when a new line needs to be inserted. Defaults to 'Assistant:'.
     */
    public static replaceLastSay(state: TurnState, newResponse: string, assistantPrefix = 'Assistant:'): void {
        if (state.conversation) {
            // Create history array if it doesn't exist
            let history: string[] = state.conversation.value[ConversationHistory.StatePropertyName];
            if (!Array.isArray(history)) {
                history = [];
            }

            // Update the last line or add a new one
            if (history.length > 0) {
                const line = history[history.length - 1];
                const lastSayPos = line.lastIndexOf(' SAY ');
                if (lastSayPos >= 0 && line.indexOf(' DO ', lastSayPos) < 0) {
                    // We found the last SAY and it wasn't followed by a DO
                    history[history.length - 1] = `${line.substring(0, lastSayPos)} SAY ${newResponse}`;
                } else if (line.indexOf(' DO ') >= 0) {
                    // Append a THEN SAY after the DO's
                    history[history.length - 1] = `${line} THEN SAY ${newResponse}`;
                } else {
                    // Just replace the entire line
                    history[history.length - 1] = `${assistantPrefix}${newResponse}`;
                }
            } else {
                history.push(`${assistantPrefix.trim()} ${newResponse}`);
            }

            // Save history back to conversation state
            state.conversation.value[ConversationHistory.StatePropertyName] = history;
        } else {
            throw new Error(
                `ConversationHistory.replaceLastSay() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    /**
     * Returns the current conversation history as a string of text.
     * @summary
     * The length of the returned text is gated by `maxCharacterLength` and only whole lines of
     * history entries will be returned. That means that if the length of the most recent history
     * entry is greater then `maxCharacterLength`, no text will be returned.
     * @param {TurnState} state Application's turn state.
     * @param {number} maxTokens Optional. Maximum length of the text returned. Defaults to 1000 tokens.
     * @param {string} lineSeparator Optional. Separator used between lines. Defaults to '\n'.
     * @returns {string} The most recent lines of conversation history as a text string.
     */
    public static toString(state: TurnState, maxTokens = 1000, lineSeparator = '\n'): string {
        if (state.conversation) {
            // Get history array if it exists
            const history: string[] = state.conversation.value[ConversationHistory.StatePropertyName] ?? [];

            // Populate up to max chars
            let text = '';
            let textTokens = 0;
            const lineSeparatorTokens = encode(lineSeparator).length;
            for (let i = history.length - 1; i >= 0; i--) {
                // Ensure that adding line won't go over the max character length
                const line = history[i];
                const lineTokens = encode(line).length;
                const newTextTokens = textTokens + lineTokens + lineSeparatorTokens;
                if (newTextTokens > maxTokens) {
                    break;
                }

                // Prepend line to output
                text = `${line}${lineSeparator}${text}`;
                textTokens = newTextTokens;
            }

            return text.trim();
        } else {
            throw new Error(
                `ConversationHistory.toString() was passed a state object without a 'conversation' state member.`
            );
        }
    }

    /**
     * Returns the current conversation history as an array of lines.
     * @param {TurnState} state The Application's turn state.
     * @param {number} maxTokens Optional. Maximum length of the text to include. Defaults to 1000 tokens.
     * @returns {string[]} The most recent lines of conversation history as an array.
     */
    public static toArray(state: TurnState, maxTokens = 1000): string[] {
        if (state.conversation) {
            // Get history array if it exists
            const history: string[] = state.conversation.value[ConversationHistory.StatePropertyName] ?? [];

            // Populate up to max chars
            let textTokens = 0;
            const lines: string[] = [];
            for (let i = history.length - 1; i >= 0; i--) {
                // Ensure that adding line won't go over the max character length
                const line = history[i];
                const lineTokens = encode(line).length;
                const newTextTokens = textTokens + lineTokens;
                if (newTextTokens > maxTokens) {
                    break;
                }

                // Prepend line to output
                textTokens = newTextTokens;
                lines.unshift(line);
            }

            return lines;
        } else {
            throw new Error(
                `ConversationHistory.toArray() was passed a state object without a 'conversation' state member.`
            );
        }
    }
}
