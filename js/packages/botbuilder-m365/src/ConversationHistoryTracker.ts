/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { TurnState } from "./TurnState";

export interface ConversationHistoryTurn {
    user: string;
    bot: string[];
}

export interface ConversationHistoryOptions {
    maxTurns: number;
    maxCharacterLength: number;
    userPrefix: string;
    botPrefix: string;
}

export class ConversationHistoryTracker {
    public static readonly StatePropertyName = '__history__';

    public static hasStartedTurn(context: TurnContext, state: TurnState): boolean {
        const turn = state.temp?.value[this.StatePropertyName] as ConversationHistoryTurn;
        return !!turn;
    }

    public static startTurn(context: TurnContext, state: TurnState): void {
        // Ensure new turn
        if (this.hasStartedTurn(context, state)) {
            throw new Error(`ConversationHistoryTracker.startTurn() was called more than once for the current turn.`);
        }

        // Initiate a new tracking record a save to turn state
        const turn = { user: context.activity.text ?? '', bot: [] };
        state.temp.value[this.StatePropertyName] = turn;
    }

    public static appendBotResponse(context, state: TurnState, response: string): void {
        // Ensure turn started
        const turn = state.temp.value[this.StatePropertyName] as ConversationHistoryTurn;
        if (!turn) {
            throw new Error(`ConversationHistoryTracker.appendBotResponse() called before ConversationHistoryTracker.startTurn() was called.`);
        }

        // Append response to tracking record and save back to turn state
        turn.bot.push(response);
        state.temp.value[this.StatePropertyName] = turn;
    }

    public static endTurn(context: TurnContext, state: TurnState, options?: Partial<ConversationHistoryOptions>): void {
        const o = this.getOptions(options);

        // Get current turn from state
        const turn = state.temp?.value[this.StatePropertyName] as ConversationHistoryTurn;
        if (!turn) {
            throw new Error(`ConversationHistoryTracker.endTurn() was called but no current turn was found.`);

        }

        // Commit turn to history
        let history = state.conversation.value[this.StatePropertyName] as ConversationHistoryTurn[];
        if (Array.isArray(history)) {
            history.push(turn);
        } else {
            history = [turn];
        }

        // Constrain history to max turns
        if (o.maxTurns > 0 && history.length > o.maxTurns) {
            history = history.slice(history.length - o.maxTurns);
        }

        // Save to state
        state.conversation.value[this.StatePropertyName] = history;
        state.temp.value[this.StatePropertyName] = undefined;
    }

    public static getHistoryAsText(context: TurnContext, state: TurnState, options?: Partial<ConversationHistoryOptions>): string {
        const o = this.getOptions();

        // Generate text
        let text = '';
        const history = state.conversation.value[this.StatePropertyName] as ConversationHistoryTurn[];
        if (Array.isArray(history)) {
            for (let i = history.length - 1; i >= 0; i--) {
                // Create a turn chunk
                let turn = `${o.userPrefix} ${history[i].user}\n`.trimStart();
                history[i].bot.forEach((response) => {
                    turn += `${o.botPrefix} ${response}\n`.trimStart();
                });
                
                // Enforce max character length
                if (o.maxCharacterLength > 0 && (turn.length + text.length) > o.maxCharacterLength) {
                    break;
                }

                // Prepend text pair
                text = turn + text;
            }
        }

        return text.trimEnd();
    }

    public static getOptions(options?: Partial<ConversationHistoryOptions>): ConversationHistoryOptions {
        return Object.assign({
            maxTurns: 10,
            maxCharacterLength: 4000,
            userPrefix: 'Human:',
            botPrefix: 'AI:'
        } as ConversationHistoryOptions, options);

    }
}