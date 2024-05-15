/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Planner, Plan, PredictedDoCommand, PredictedSayCommand } from './Planner';
import { TurnState } from '../TurnState';
import { TurnContext } from 'botbuilder';
import { AI } from '../AI';
import {
    Assistant,
    AssistantCreationOptions,
    AssistantsClient,
    AzureKeyCredential,
    OpenAIKeyCredential,
    RequiredAction,
    ThreadMessage,
    ThreadRun,
    ToolOutput
} from '@azure/openai-assistants';

/**
 * @private
 */
const DEFAULT_POLLING_INTERVAL = 1000;

/**
 * @private
 */
const DEFAULT_ASSISTANTS_STATE_VARIABLE = 'conversation.assistants_state';

/**
 * @private
 */
const SUBMIT_TOOL_OUTPUTS_VARIABLE = 'temp.submit_tool_outputs';

/**
 * @private
 */
const SUBMIT_TOOL_OUTPUTS_MAP = 'temp.submit_tool_map';

/**
 * Options for configuring the AssistantsPlanner.
 */
export interface AssistantsPlannerOptions {
    /**
     * The OpenAI or Azure OpenAI API key.
     */
    apiKey: string;

    /**
     * The Azure OpenAI resource endpoint.
     */
    endpoint?: string;

    /**
     * The ID of the assistant to use.
     */
    assistant_id: string;

    /**
     * Optional. Polling interval in milliseconds.
     * @remarks
     * Defaults to 1000 (once a second).
     */
    polling_interval?: number;

    /**
     * Optional. The state variable to use for storing the assistants state.
     * @remarks
     * Defaults to 'conversation.assistants_state'.
     */
    assistants_state_variable?: string;
}

/**
 * A Planner that uses the OpenAI Assistants API.
 * @template TState Optional. Type of application state.
 */
export class AssistantsPlanner<TState extends TurnState = TurnState> implements Planner<TState> {
    private readonly _options: AssistantsPlannerOptions;
    protected _client: AssistantsClient;
    protected _assistant?: Assistant;

    /**
     * Creates a new `AssistantsPlanner` instance.
     * @param {AssistantsPlannerOptions} options - Options for configuring the AssistantsPlanner.
     */
    public constructor(options: AssistantsPlannerOptions) {
        this._options = Object.assign(
            {
                polling_interval: DEFAULT_POLLING_INTERVAL,
                assistants_state_variable: DEFAULT_ASSISTANTS_STATE_VARIABLE
            },
            options
        );

        this._client = AssistantsPlanner.createClient(options.apiKey, options.endpoint);
    }

    /**
     * Starts a new task.
     * @remarks
     * This method is called when the AI system is ready to start a new task. The planner should
     * generate a plan that the AI system will execute. Returning an empty plan signals that
     * there is no work to be performed.
     *
     * The planner should take the users input from `state.temp.input`.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @param {AI<TState>} ai - The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public beginTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        return this.continueTask(context, state, ai);
    }

    /**
     * Continues the current task.
     * @remarks
     * This method is called when the AI system has finished executing the previous plan and is
     * ready to continue the current task. The planner should generate a plan that the AI system
     * will execute. Returning an empty plan signals that the task is completed and there is no work
     * to be performed.
     *
     * The output from the last plan step that was executed is passed to the planner via `state.temp.input`.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @param {AI<TState>} ai - The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public async continueTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // Create a new thread if we don't have one already
        const thread_id = await this.ensureThreadCreated(state, context.activity.text);

        // Add the users input to the thread or send tool outputs
        if (state.getValue(SUBMIT_TOOL_OUTPUTS_VARIABLE) == true) {
            // Send the tool output to the assistant
            return await this.submitActionResults(context, state, ai);
        } else {
            // Wait for any current runs to complete since you can't add messages or start new runs
            // if there's already one in progress
            await this.blockOnInProgressRuns(thread_id);

            // Submit user input
            return await this.submitUserInput(context, state, ai);
        }
    }

    /**
     * Static helper method for programmatically creating an assistant.
     * @param {string} apiKey - OpenAI API key.
     * @param {AssistantCreationOptions} request - Definition of the assistant to create.
     * @param {string} endpoint - The Azure OpenAI resource endpoint.
     * @returns {Promise<Assistant>} The created assistant.
     */
    public static async createAssistant(
        apiKey: string,
        request: AssistantCreationOptions,
        endpoint?: string
    ): Promise<Assistant> {
        const client = AssistantsPlanner.createClient(apiKey, endpoint);
        return await client.createAssistant(request);
    }

    /**
     * @private
     * Exposed for unit testing.
     * @param {string} thread_id The thread id to retrieve the run.
     * @returns {Promise<ThreadRun | null>} The retrieved run.
     */
    protected async retrieveLastRun(thread_id: string): Promise<ThreadRun | null> {
        const list = await this._client.listRuns(thread_id, { limit: 1 });
        if (list.data.length > 0) {
            return list.data[0];
        }

        return null;
    }

    /**
     * @private
     * @param {ThreadRun} run - The run to be checked for completion.
     * @returns {boolean} True if completed, otherwise false.
     */
    private isRunCompleted(run: ThreadRun): boolean {
        switch (run.status) {
            case 'completed':
            case 'failed':
            case 'cancelled':
            case 'expired':
                return true;
        }

        return false;
    }

    /**
     * @private
     * @param {string} thread_id - The current thread id.
     * @param {string} run_id - The run id.
     * @param {boolean} handleActions - Whether to handle actions. False by default.
     * @returns {Promise<ThreadRun>} The current Run.
     */
    private async waitForRun(thread_id: string, run_id: string, handleActions = false): Promise<ThreadRun> {
        // Wait for the run to complete
        while (true) {
            await new Promise((resolve) => setTimeout(resolve, this._options.polling_interval));

            const run = await this._client.getRun(thread_id, run_id);
            switch (run.status) {
                case 'requires_action':
                    if (handleActions) {
                        return run;
                    }
                    break;
                case 'cancelled':
                case 'failed':
                case 'completed':
                case 'expired':
                    return run;
            }
        }
    }

    /**
     * @private
     * @param {TurnContext} context - The application Turn Context.
     * @param {TState} state - The application Turn State.
     * @param {AI<TState>} ai - The AI instance.
     * @returns {Promise<Plan>} The action results as Plan.
     */
    private async submitActionResults(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // Get the current assistant state
        const assistants_state = this.ensureAssistantsState(state);

        // Map the action outputs to tool outputs
        const actionOutputs = state.temp.actionOutputs;
        const toolMap = state.getValue(SUBMIT_TOOL_OUTPUTS_MAP) as { [key: string]: string };
        const toolOutputs: ToolOutput[] = [];
        for (const action in actionOutputs) {
            const output = actionOutputs[action];
            const toolCallId = toolMap[action];
            if (toolCallId !== undefined) {
                // Add required output only
                toolOutputs.push({ toolCallId, output });
            }
        }

        // Submit the tool outputs
        const run = await this._client.submitToolOutputsToRun(
            assistants_state.thread_id!,
            assistants_state.run_id!,
            toolOutputs
        );

        // Wait for the run to complete
        const results = await this.waitForRun(assistants_state.thread_id!, run.id, true);
        switch (results.status) {
            case 'requires_action':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, true);
                return this.generatePlanFromTools(state, results.requiredAction!);
            case 'completed':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                return this.generatePlanFromMessages(assistants_state.thread_id!, assistants_state.last_message_id!);
            case 'cancelled':
                return { type: 'plan', commands: [] };
            case 'expired':
                return {
                    type: 'plan',
                    commands: [{ type: 'DO', action: AI.TooManyStepsActionName } as PredictedDoCommand]
                };
            default:
                throw new Error(
                    `Run failed ${results.status}. ErrorCode: ${results.lastError?.code}. ErrorMessage: ${results.lastError?.message}`
                );
        }
    }

    /**
     * @private
     * @param {TurnContext} context - The application Turn Context.
     * @param {TurnState} state - The application Turn State.
     * @param {AI<TState>} ai - The AI instance.
     * @returns {Promise<Plan>} - The user's input as Plan.
     */
    private async submitUserInput(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // Get the current thread_id
        const thread_id = await this.ensureThreadCreated(state, context.activity.text);

        // Add the users input to the thread
        const message = await this._client.createMessage(thread_id, 'user', state.temp.input);

        // Create a new run
        const run = await this._client.createRun(thread_id, {
            assistantId: this._options.assistant_id
        });

        // Update state and wait for the run to complete
        this.updateAssistantsState(state, { thread_id, run_id: run.id, last_message_id: message.id ?? null });
        const results = await this.waitForRun(thread_id, run.id, true);
        switch (results.status) {
            case 'requires_action':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, true);
                return this.generatePlanFromTools(state, results.requiredAction!);
            case 'completed':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                return this.generatePlanFromMessages(thread_id, message.id!);
            case 'cancelled':
                return { type: 'plan', commands: [] };
            case 'expired':
                return {
                    type: 'plan',
                    commands: [{ type: 'DO', action: AI.TooManyStepsActionName } as PredictedDoCommand]
                };
            default:
                throw new Error(
                    `Run failed ${results.status}. ErrorCode: ${results.lastError?.code}. ErrorMessage: ${results.lastError?.message}`
                );
        }
    }

    /**
     * @private
     * @param {TurnState} state - The application Turn State.
     * @param {RequiredAction} required_action - The required action.
     * @returns {Plan} - The generated Plan.
     */
    private generatePlanFromTools(state: TState, required_action: RequiredAction): Plan {
        const plan: Plan = { type: 'plan', commands: [] };
        const tool_map: { [key: string]: string } = {};
        required_action.submitToolOutputs!.toolCalls.forEach((tool_call) => {
            tool_map[tool_call.function.name] = tool_call.id;
            plan.commands.push({
                type: 'DO',
                action: tool_call.function.name,
                parameters: JSON.parse(tool_call.function.arguments)
            } as PredictedDoCommand);
        });
        state.setValue(SUBMIT_TOOL_OUTPUTS_MAP, tool_map);
        return plan;
    }

    /**
     * @private
     * @param {string} thread_id - The current thread's ID.
     * @param {string} last_message_id - ID of the last message.
     * @returns {Promise<Plan>} The generated Plan from messages.
     */
    private async generatePlanFromMessages(thread_id: string, last_message_id: string): Promise<Plan> {
        // Find the new messages
        const messages = await this._client.listMessages(thread_id);
        const newMessages: ThreadMessage[] = [];
        for (let i = 0; i < messages.data.length; i++) {
            const message = messages.data[i];
            if (message.id == last_message_id) {
                break;
            } else {
                newMessages.push(message);
            }
        }

        // listMessages return messages in desc, reverse to be in asc order
        newMessages.reverse();

        // Convert the messages to SAY commands
        const plan: Plan = { type: 'plan', commands: [] };
        newMessages.forEach((message) => {
            message.content.forEach((content) => {
                if (content.type == 'text') {
                    plan.commands.push({
                        type: 'SAY',
                        response: {
                            role: 'assistant',
                            content: content.text.value,
                            context: {
                                intent: '',
                                citations: content.text.annotations.map(annotation => ({
                                    title: '',
                                    url: '',
                                    filepath: '',
                                    content: annotation.text
                                }))
                            }
                        }
                    } as PredictedSayCommand);
                }
            });
        });
        return plan;
    }

    /**
     * @private
     * @param {TurnState} state - The application Turn State.
     * @returns {AssistantsState} - The current Assistant's State.
     */
    private ensureAssistantsState(state: TState): AssistantsState {
        if (!state.hasValue(this._options.assistants_state_variable!)) {
            state.setValue(this._options.assistants_state_variable!, {
                thread_id: null,
                run_id: null,
                last_message_id: null
            } as AssistantsState);
        }

        return state.getValue(this._options.assistants_state_variable!);
    }

    /**
     * @param {TurnState} state - The application Turn State.
     * @param {AssistantsState} assistants_state - The Assistant's State.
     * @private
     */
    private updateAssistantsState(state: TState, assistants_state: AssistantsState): void {
        state.setValue(this._options.assistants_state_variable!, assistants_state);
    }

    /**
     * @private
     * @param {TurnState} state - The application Turn State.
     * @param {string} input - The thread input.
     * @returns {Promise<string>} The created thread.
     */
    private async ensureThreadCreated(state: TState, input: string): Promise<string> {
        const assistants_state = this.ensureAssistantsState(state);
        if (assistants_state.thread_id == null) {
            const thread = await this._client.createThread({});
            assistants_state.thread_id = thread.id;
            this.updateAssistantsState(state, assistants_state);
        }

        return assistants_state.thread_id;
    }

    /**
     * @private
     * @param {string} thread_id - The id of the thread.
     * @returns {Promise<void>} A Promise.
     */
    private async blockOnInProgressRuns(thread_id: string): Promise<void> {
        // We loop until we're told the last run is completed
        while (true) {
            const runs = await this._client.listRuns(thread_id, { limit: 1 });
            if (runs.data.length == 0) {
                return;
            }

            const run = runs.data[0];

            if (!run || this.isRunCompleted(run)) {
                return;
            }

            // Wait for the current run to complete and then loop to see if there's already a new run.
            await this.waitForRun(thread_id, run.id);
        }
    }

    /**
     * @private
     * @param {string} apiKey - The api key
     * @param {string} endpoint  - The Azure OpenAI resource endpoint
     * @returns {AssistantsClient} the client
     */
    private static createClient(apiKey: string, endpoint?: string): AssistantsClient {
        if (endpoint) {
            // Azure OpenAI
            return new AssistantsClient(endpoint, new AzureKeyCredential(apiKey));
        } else {
            // OpenAI
            return new AssistantsClient(new OpenAIKeyCredential(apiKey));
        }
    }
}

/**
 * @private
 */
interface AssistantsState {
    thread_id: string | null;
    run_id: string | null;
    last_message_id: string | null;
}
