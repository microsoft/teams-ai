/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import OpenAI from 'openai';
import { Planner, Plan, PredictedDoCommand, PredictedSayCommand } from './Planner';
import { TurnState } from '../TurnState';
import { TurnContext } from 'botbuilder';
import { AI } from '../AI';

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
     * The OpenAI API key.
     */
    apiKey: string;

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
    private readonly _openai: OpenAI;
    private _assistant?: OpenAI.Beta.Assistants.Assistant;

    /**
     * Creates a new `AssistantsPlanner` instance.
     * @param options Options for configuring the AssistantsPlanner.
     */
    public constructor(options: AssistantsPlannerOptions) {
        this._options = Object.assign({
            polling_interval: DEFAULT_POLLING_INTERVAL,
            assistants_state_variable: DEFAULT_ASSISTANTS_STATE_VARIABLE
        }, options);
        this._openai = new OpenAI({
            apiKey: this._options.apiKey
        });
    }

    /**
     * Gets the OpenAI SDK instance being used.
     */
    public get openai(): OpenAI {
        return this._openai;
    }

    /**
     * Starts a new task.
     * @remarks
     * This method is called when the AI system is ready to start a new task. The planner should
     * generate a plan that the AI system will execute. Returning an empty plan signals that
     * there is no work to be performed.
     *
     * The planner should take the users input from `state.temp.input`.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param ai The AI system that is generating the plan.
     * @returns The plan that was generated.
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
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param ai The AI system that is generating the plan.
     * @returns The plan that was generated.
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
     * @param apiKey OpenAI API key.
     * @param request Definition of the assistant to create.
     * @returns The created assistant.
     */
    public static async createAssistant(apiKey: string, request: OpenAI.Beta.Assistants.AssistantCreateParams): Promise<OpenAI.Beta.Assistants.Assistant> {
        const openai = new OpenAI({
            apiKey
        });

        return await openai.beta.assistants.create(request);
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async retrieveAssistant(): Promise<OpenAI.Beta.Assistants.Assistant> {
        // Retrieve the assistant on first request
        if (!this._assistant) {
            this._assistant = await this.openai.beta.assistants.retrieve(this._options.assistant_id);
        }

        return this._assistant;
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async createMessage(thread_id: string, body: OpenAI.Beta.Threads.Messages.MessageCreateParams): Promise<OpenAI.Beta.Threads.Messages.ThreadMessage> {
        return await this.openai.beta.threads.messages.create(thread_id, body);
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async createThread(request: OpenAI.Beta.Threads.ThreadCreateParams): Promise<OpenAI.Beta.Threads.Thread> {
        return await this.openai.beta.threads.create(request);
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async listMessages(thread_id: string): Promise<OpenAI.Beta.Threads.Messages.ThreadMessagesPage> {
        return await this.openai.beta.threads.messages.list(thread_id);
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async createRun(thread_id: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
        return await this.openai.beta.threads.runs.create(
            thread_id,
            {
              assistant_id: this._options.assistant_id
            }
        );
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async retrieveRun(thread_id: string, run_id: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
        return await this.openai.beta.threads.runs.retrieve(
            thread_id,
            run_id
        );
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async retrieveLastRun(thread_id: string): Promise<OpenAI.Beta.Threads.Runs.Run|null> {
        const list = await this.openai.beta.threads.runs.list(thread_id, { limit: 1 });
        if (list.data.length > 0) {
            return list.data[0];
        }

        return null;
    }

    /**
     * @private
     * Exposed for unit testing.
     */
    protected async submitToolOutputs(thread_id: string, run_id: string, tool_outputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams): Promise<OpenAI.Beta.Threads.Runs.Run> {
        return await this.openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, tool_outputs);
    }

    /**
     * @private
     */
    private isRunCompleted(run: OpenAI.Beta.Threads.Runs.Run): boolean {
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
     */
    private async waitForRun(thread_id: string, run_id: string, handleActions = false): Promise<OpenAI.Beta.Threads.Runs.Run> {
        // Wait for the run to complete
        while (true) {
            await new Promise(resolve => setTimeout(resolve, this._options.polling_interval));

            const run = await this.retrieveRun(thread_id, run_id);
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
     */
    private async submitActionResults(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // Get the current assistant state
        const assistants_state = this.ensureAssistantsState(state);

        // Map the action outputs to tool outputs
        const actionOutputs = state.temp.actionOutputs;
        const tool_map = state.getValue(SUBMIT_TOOL_OUTPUTS_MAP) as {[key: string]: string};
        const tool_outputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];
        for (const action in actionOutputs) {
            const output = actionOutputs[action];
            const tool_call_id = tool_map[action];
            if (tool_call_id !== undefined) {
                // Add required output only
                tool_outputs.push({ tool_call_id, output });
            }
        }

        // Submit the tool outputs
        const run = await this.submitToolOutputs(assistants_state.thread_id!, assistants_state.run_id!, {
            tool_outputs
        });

        // Wait for the run to complete
        const results = await this.waitForRun(assistants_state.thread_id!, run.id, true);
        switch (results.status) {
            case 'requires_action':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, true);
                return this.generatePlanFromTools(state, results.required_action!);
            case 'completed':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                return this.generatePlanFromMessages(assistants_state.thread_id!, assistants_state.last_message_id!);
            case 'cancelled':
                return { type: 'plan', commands: [] };
            case 'expired':
                return { type: 'plan', commands: [{type: 'DO', action: AI.TooManyStepsActionName} as PredictedDoCommand] };
            default:
                throw new Error(
                    `Run failed ${results.status}. ErrorCode: ${results.last_error?.code}. ErrorMessage: ${results.last_error?.message}`
                );
        }
    }

    /**
     * @private
     */
    private async submitUserInput(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // Get the current thread_id
        const thread_id = await this.ensureThreadCreated(state, context.activity.text);

        // Add the users input to the thread
        const message = await this.createMessage(thread_id, {
            role: 'user',
            content: state.temp.input
        });

        // Create a new run
        const run = await this.createRun(thread_id);

        // Update state and wait for the run to complete
        this.updateAssistantsState(state, { thread_id, run_id: run.id, last_message_id: message.id });
        const results = await this.waitForRun(thread_id, run.id, true);
        switch (results.status) {
            case 'requires_action':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, true);
                return this.generatePlanFromTools(state, results.required_action!);
            case 'completed':
                state.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                return this.generatePlanFromMessages(thread_id, message.id);
            case 'cancelled':
                return { type: 'plan', commands: [] };
            case 'expired':
                return { type: 'plan', commands: [{type: 'DO', action: AI.TooManyStepsActionName} as PredictedDoCommand] };
            default:
                throw new Error(
                    `Run failed ${results.status}. ErrorCode: ${results.last_error?.code}. ErrorMessage: ${results.last_error?.message}`
                );
        }
    }

    /**
     * @private
     */
    private generatePlanFromTools(state: TState, required_action: OpenAI.Beta.Threads.Runs.Run.RequiredAction): Plan {
        const plan: Plan = { type: 'plan', commands: [] };
        const tool_map: {[key: string]: string} = {};
        required_action.submit_tool_outputs.tool_calls.forEach(tool_call => {
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
     */
    private async generatePlanFromMessages(thread_id: string, last_message_id: string): Promise<Plan> {
        // Find the new messages
        const messages = await this.listMessages(thread_id);
        const newMessages: OpenAI.Beta.Threads.Messages.ThreadMessage[] = [];
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
        newMessages.forEach(message => {
            message.content.forEach(content => {
                if (content.type == 'text') {
                    plan.commands.push({
                        type: 'SAY',
                        response: (content as any).text.value
                    } as PredictedSayCommand);
                }
            });
        });
        return plan;
    }

    /**
     * @private
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
     * @private
     */
    private updateAssistantsState(state: TState, assistants_state: AssistantsState): void {
        state.setValue(this._options.assistants_state_variable!, assistants_state);
    }

    /**
     * @private
     */
    private async ensureThreadCreated(state: TState, input: string): Promise<string> {
        const assistants_state = this.ensureAssistantsState(state);
        if (assistants_state.thread_id == null) {
            const thread = await this.createThread({});
            assistants_state.thread_id = thread.id;
            this.updateAssistantsState(state, assistants_state);
        }

        return assistants_state.thread_id;
    }

    /**
     * @private
     */
    private async blockOnInProgressRuns(thread_id: string): Promise<void> {
        // We loop until we're told the last run is completed
        while (true) {
            const run = await this.retrieveLastRun(thread_id);
            if (!run || this.isRunCompleted(run)) {
                return;
            }

            // Wait for the current run to complete and then loop to see if there's already a new run.
            await this.waitForRun(thread_id, run.id);
        }
    }

}

/**
 * @private
 */
interface AssistantsState {
    thread_id: string|null;
    run_id: string|null;
    last_message_id: string|null;
}