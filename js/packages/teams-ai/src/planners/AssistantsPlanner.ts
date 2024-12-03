/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import OpenAI from 'openai';

import { AI } from '../AI';
import { TurnState } from '../TurnState';

import { Planner, Plan, PredictedDoCommand, PredictedSayCommand } from './Planner';

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
const SUBMIT_TOOL_OUTPUTS_VARIABLE = 'temp.submitToolOutputs';

/**
 * @private
 */
const SUBMIT_TOOL_OUTPUTS_MAP = 'temp.submitToolMap';

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
    protected _client: OpenAI;

    /**
     * Creates a new `AssistantsPlanner` instance.
     * @param {AssistantsPlannerOptions} options - Options for configuring the AssistantsPlanner.
     */
    public constructor(options: AssistantsPlannerOptions) {
        this._options = {
            polling_interval: DEFAULT_POLLING_INTERVAL,
            assistants_state_variable: DEFAULT_ASSISTANTS_STATE_VARIABLE,
            ...options
        };

        this._client = new OpenAI({ apiKey: options.apiKey, baseURL: options.endpoint });
    }

    /**
     * Starts a new task.
     * @remarks
     * This method is called when the AI system is ready to start a new task. It delegates the
     * task handling to the `continueTask` method. The planner should
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
     * This method is called when the AI system is ready to continue the current task. It handles:
     * - Creating a new thread if one doesn't exist
     * - Submitting tool outputs if required
     * - Waiting for any in-progress runs to complete
     * - Submitting user input and creating a new run
     * The method generates a plan that the AI system will execute. Returning an empty plan signals
     * that the task is completed and there is no work to be performed.
     *
     * The output from the last plan step that was executed is passed to the planner via `state.temp.input`.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @param {AI<TState>} ai - The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public async continueTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // Create a new thread if we don't have one already
        const threadId = await this.ensureThreadCreated(state, context.activity.text);

        if (state.getValue(SUBMIT_TOOL_OUTPUTS_VARIABLE)) {
            // Handle required actions
            return await this.submitActionResults(context, state, ai);
        }

        // Wait for any current runs to complete since you can't add messages or start new runs
        // if there's already one in progress
        await this.blockOnInProgressRuns(threadId);

        // Submit user input
        return await this.submitUserInput(context, state, ai);
    }

    /**
     * Static helper method for programmatically creating an assistant.
     * @param {string} apiKey - OpenAI API key.
     * @param {OpenAI.Beta.AssistantCreateParams} request - Definition of the assistant to create.
     * @param {string} endpoint - The Azure OpenAI resource endpoint.
     * @returns {Promise<OpenAI.Beta.Assistant>} The created assistant.
     */
    public static async createAssistant(
        apiKey: string,
        request: OpenAI.Beta.AssistantCreateParams,
        endpoint?: string
    ): Promise<OpenAI.Beta.Assistant> {
        const client = new OpenAI({ apiKey, baseURL: endpoint });
        return await client.beta.assistants.create(request);
    }

    private async ensureThreadCreated(state: TState, input: string): Promise<string> {
        const assistantsState = this.ensureAssistantsState(state);
        if (assistantsState.thread_id == null) {
            const thread = await this._client.beta.threads.create();
            assistantsState.thread_id = thread.id;
            this.updateAssistantsState(state, assistantsState);
        }

        return assistantsState.thread_id;
    }

    private isRunCompleted(run: OpenAI.Beta.Threads.Run): boolean {
        return ['completed', 'failed', 'cancelled', 'expired'].includes(run.status);
    }

    /**
     * Waits for a run to complete.
     * @param {string} thread_id - The ID of the thread.
     * @param {string} run_id - The ID of the run.
     * @param {boolean} handleActions - Whether to handle actions.
     * @returns {Promise<OpenAI.Beta.Threads.Run>} The completed run.
     */
    private async waitForRun(
        thread_id: string,
        run_id: string,
        handleActions = false
    ): Promise<OpenAI.Beta.Threads.Run> {
        while (true) {
            await new Promise((resolve) => setTimeout(resolve, this._options.polling_interval));

            const run = await this._client.beta.threads.runs.retrieve(thread_id, run_id);
            if ((run.status === 'requires_action' && handleActions) || this.isRunCompleted(run)) {
                return run;
            }
        }
    }

    /**
     * Submits action results to the assistant.
     * @param {TurnContext} context - The turn context.
     * @param {TState} state - The turn state.
     * @param {AI<TState>} ai - The AI instance.
     * @returns {Promise<Plan>} A plan based on the action results.
     */
    protected async submitActionResults(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        const assistantsState = this.ensureAssistantsState(state);

        const actionOutputs = state.temp.actionOutputs;
        const toolMap = state.getValue(SUBMIT_TOOL_OUTPUTS_MAP) as { [key: string]: string };
        const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];
        for (const action in actionOutputs) {
            const output = actionOutputs[action];
            const toolCallId = toolMap[action];
            if (toolCallId !== undefined) {
                toolOutputs.push({ tool_call_id: toolCallId, output });
            }
        }

        const run = await this._client.beta.threads.runs.submitToolOutputs(
            assistantsState.thread_id!,
            assistantsState.run_id!,
            { tool_outputs: toolOutputs }
        );

        const results = await this.waitForRun(assistantsState.thread_id!, run.id, true);
        switch (results.status) {
            case 'requires_action':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, true);
                return this.generatePlanFromTools(state, results.required_action!.submit_tool_outputs.tool_calls);
            case 'completed':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                return this.generatePlanFromMessages(assistantsState.thread_id!, assistantsState.last_message_id!);
            case 'cancelled':
                return { type: 'plan', commands: [] };
            case 'expired':
                const expiredCommand: PredictedDoCommand = {
                    type: 'DO',
                    action: AI.TooManyStepsActionName,
                    parameters: {}
                };
                return {
                    type: 'plan',
                    commands: [expiredCommand]
                };
            default:
                throw new Error(
                    `Run failed ${results.status}. ErrorCode: ${results.last_error?.code}. ErrorMessage: ${results.last_error?.message}`
                );
        }
    }

    /**
     * Submits user input to the assistant.
     * @param {TurnContext} context - The turn context.
     * @param {TState} state - The turn state.
     * @param {AI<TState>} ai - The AI instance.
     * @returns {Promise<Plan>} A plan based on the user input.
     */
    private async submitUserInput(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        const threadId = await this.ensureThreadCreated(state, context.activity.text);

        const message = await this._client.beta.threads.messages.create(threadId, {
            role: 'user',
            content: state.temp.input
        });

        const run = await this._client.beta.threads.runs.create(threadId, {
            assistant_id: this._options.assistant_id
        });

        this.updateAssistantsState(state, { thread_id: threadId, run_id: run.id, last_message_id: message.id });
        const results = await this.waitForRun(threadId, run.id, true);
        switch (results.status) {
            case 'requires_action':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, true);
                return this.generatePlanFromTools(state, results.required_action!.submit_tool_outputs.tool_calls);
            case 'completed':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                return this.generatePlanFromMessages(threadId, message.id);
            case 'cancelled':
                return { type: 'plan', commands: [] };
            case 'expired':
                const expiredCommand: PredictedDoCommand = {
                    type: 'DO',
                    action: AI.TooManyStepsActionName,
                    parameters: {}
                };
                return {
                    type: 'plan',
                    commands: [expiredCommand]
                };
            default:
                throw new Error(
                    `Run failed ${results.status}. ErrorCode: ${results.last_error?.code}. ErrorMessage: ${results.last_error?.message}`
                );
        }
    }

    /**
     * Generates a plan from tool calls.
     * @param {TState} state - The turn state.
     * @param {OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall[]} toolCalls - The tool calls to generate the plan from.
     * @returns {Plan} A plan based on the tool calls.
     */
    private generatePlanFromTools(
        state: TState,
        toolCalls: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall[]
    ): Plan {
        const plan: Plan = { type: 'plan', commands: [] };
        const toolMap: { [key: string]: string } = {};
        toolCalls.forEach((toolCall) => {
            toolMap[toolCall.function.name] = toolCall.id;
            const doCommand: PredictedDoCommand = {
                type: 'DO',
                action: toolCall.function.name,
                parameters: JSON.parse(toolCall.function.arguments)
            };
            plan.commands.push(doCommand);
        });
        state.setValue(SUBMIT_TOOL_OUTPUTS_MAP, toolMap);
        return plan;
    }

    /**
     * Generates a plan from messages.
     * @param {string} thread_id - The ID of the thread.
     * @param {string} last_message_id - The ID of the last message.
     * @returns {Promise<Plan>} A plan based on the messages.
     */
    private async generatePlanFromMessages(thread_id: string, last_message_id: string): Promise<Plan> {
        const messages = await this._client.beta.threads.messages.list(thread_id);
        const newMessages = messages.data.filter((message) => message.id !== last_message_id);

        const plan: Plan = { type: 'plan', commands: [] };
        newMessages.forEach((message) => {
            message.content.forEach((content) => {
                if (content.type === 'text') {
                    const sayCommand: PredictedSayCommand = {
                        type: 'SAY',
                        response: {
                            role: 'assistant',
                            content: content.text.value,
                            context: {
                                intent: '',
                                citations:
                                    content.text.annotations?.map((annotation) => ({
                                        title: '',
                                        url: '',
                                        filepath: '',
                                        content: annotation.text
                                    })) || []
                            }
                        }
                    };
                    plan.commands.push(sayCommand);
                }
            });
        });
        return plan;
    }

    /**
     * Ensures that the assistants state exists in the turn state.
     * @param {TState} state - The turn state.
     * @returns {AssistantsState} The assistants state.
     */
    protected ensureAssistantsState(state: TState): AssistantsState {
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
     * Updates the assistants state in the turn state.
     * @param {TState} state - The turn state.
     * @param {AssistantsState} assistantsState - The new assistants state.
     */
    private updateAssistantsState(state: TState, assistantsState: AssistantsState): void {
        state.setValue(this._options.assistants_state_variable!, assistantsState);
    }

    /**
     * Blocks until all in-progress runs are completed.
     * @param {string} thread_id - The ID of the thread.
     */
    private async blockOnInProgressRuns(thread_id: string): Promise<void> {
        while (true) {
            const runs = await this._client.beta.threads.runs.list(thread_id, { limit: 1 });
            if (runs.data.length === 0) {
                return; // No runs, so we're done
            }
            const latestRun = runs.data[0];
            if (this.isRunCompleted(latestRun)) {
                return; // Latest run is completed, so we're done
            }
            await this.waitForRun(thread_id, latestRun.id);
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

