/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage } from 'botbuilder';

import { Application, ApplicationOptions } from './Application';
import { TeamsAdapter } from './TeamsAdapter';
import { AIOptions } from './AI';
import { TurnState } from './TurnState';
import { AdaptiveCardsOptions } from './AdaptiveCards';
import { TaskModulesOptions } from './TaskModules';
import { AuthenticationOptions } from './authentication';

/**
 * A builder class for simplifying the creation of an Application instance.
 * @template TState Optional. Type of the turn state. This allows for strongly typed access to the turn state.
 */
export class ApplicationBuilder<TState extends TurnState = TurnState> {
    private _options: Partial<ApplicationOptions<TState>> = {};

    /**
     * Configures the application to use long running messages.
     * Default state for longRunningMessages is false
     * @param {TeamsAdapter} adapter The adapter to use for routing incoming requests.
     * @param {string} botAppId The Microsoft App ID for the bot.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withLongRunningMessages(adapter: TeamsAdapter, botAppId: string): this {
        if (!botAppId) {
            throw new Error(
                `The Application.longRunningMessages property is unavailable because botAppId cannot be null or undefined.`
            );
        }

        this._options.longRunningMessages = true;
        this._options.adapter = adapter;
        this._options.botAppId = botAppId;
        return this;
    }

    /**
     * Configures the storage system to use for storing the bot's state.
     * @param {Storage} storage The storage system to use.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withStorage(storage: Storage): this {
        this._options.storage = storage;
        return this;
    }

    /**
     * Configures the AI system to use for processing incoming messages.
     * @param {AIOptions<TState>} aiOptions The options for the AI system.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withAIOptions(aiOptions: AIOptions<TState>): this {
        this._options.ai = aiOptions;
        return this;
    }

    /**
     * Configures the processing of Adaptive Card requests.
     * @param {AdaptiveCardsOptions} adaptiveCardOptions The options for the Adaptive Cards.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withAdaptiveCardOptions(adaptiveCardOptions: AdaptiveCardsOptions): this {
        this._options.adaptiveCards = adaptiveCardOptions;
        return this;
    }

    /**
     * Configures the processing of Task Module requests.
     * @param {TaskModulesOptions} taskModuleOptions The options for the Task Modules.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withTaskModuleOptions(taskModuleOptions: TaskModulesOptions): this {
        this._options.taskModules = taskModuleOptions;
        return this;
    }

    /**
     * Configures user authentication settings.
     * @param {TeamsAdapter} adapter The adapter to use for user authentication.
     * @param {AuthenticationOptions} authenticationOptions The options to configure the authentication manager.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withAuthentication(adapter: TeamsAdapter, authenticationOptions: AuthenticationOptions): this {
        this._options.adapter = adapter;
        this._options.authentication = authenticationOptions;
        return this;
    }

    /**
     * Configures the turn state factory for managing the bot's turn state.
     * @param {() => TState} turnStateFactory Factory used to create a custom turn state instance.
     * @returns {this} The ApplicationBuilder instance.
     */
    public withTurnStateFactory(turnStateFactory: () => TState): this {
        this._options.turnStateFactory = turnStateFactory;
        return this;
    }

    /**
     * Configures the removing of mentions of the bot's name from incoming messages.
     * Default state for removeRecipientMention is true
     * @param {boolean} removeRecipientMention The boolean for removing reciepient mentions.
     * @returns {this} The ApplicationBuilder instance.
     */
    public setRemoveRecipientMention(removeRecipientMention: boolean): this {
        this._options.removeRecipientMention = removeRecipientMention;
        return this;
    }

    /**
     * Configures the typing timer when messages are received.
     * Default state for startTypingTimer is true
     * @param {boolean} startTypingTimer The boolean for starting the typing timer.
     * @returns {this} The ApplicationBuilder instance.
     */
    public setStartTypingTimer(startTypingTimer: boolean): this {
        this._options.startTypingTimer = startTypingTimer;
        return this;
    }

    /**
     * Builds and returns a new Application instance.
     * @returns {Application<TState>} The Application instance.
     */
    public build(): Application<TState> {
        return new Application(this._options);
    }
}
