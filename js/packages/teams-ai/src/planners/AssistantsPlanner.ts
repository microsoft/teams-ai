import OpenAI from 'openai';
import { Planner, Plan, PredictedDoCommand, PredictedSayCommand } from './Planner';
import { TurnState } from '../TurnState';
import { TurnContext } from 'botbuilder';
import { AI } from '../AI';

const DEFAULT_POLLING_INTERVAL = 1000;
const DEFAULT_ASSISTANTS_STATE_VARIABLE = 'conversation.assistants_state';
const SUBMIT_TOOL_OUTPUTS_VARIABLE = 'temp.submit_tool_outputs';
const SUBMIT_TOOL_OUTPUTS_MAP = 'temp.submit_tool_map';

export interface AssistantsPlannerOptions {
    apiKey: string;
    assistant_id: string;
    polling_interval?: number;
    assistants_state_variable?: string;
}

export class AssistantsPlanner<TState extends TurnState = TurnState> implements Planner<TState> {
    private readonly _options: AssistantsPlannerOptions;
    private readonly _openai: OpenAI;
    private _assistant?: OpenAI.Beta.Assistants.Assistant;

    public constructor(options: AssistantsPlannerOptions) {
        this._options = Object.assign({
            polling_interval: DEFAULT_POLLING_INTERVAL,
            assistants_state_variable: DEFAULT_ASSISTANTS_STATE_VARIABLE
        }, options);
        this._openai = new OpenAI({
            apiKey: this._options.apiKey
        });
    }

    public get openai(): OpenAI {
        return this._openai;
    }

    public beginTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        return this.continueTask(context, state, ai);
    }

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
            await this.blockOnInprogressRuns(thread_id);

            // Submit user input
            return await this.submitUserInput(context, state, ai);
        }
    }

    public static async createAssistant(apiKey: string, request: OpenAI.Beta.Assistants.AssistantCreateParams): Promise<OpenAI.Beta.Assistants.Assistant> {
        const openai = new OpenAI({
            apiKey
        });

        return await openai.beta.assistants.create(request);
    }

    protected async retrieveAssistant(): Promise<OpenAI.Beta.Assistants.Assistant> {
        // Retrieve the assistant on first request
        if (!this._assistant) {
            this._assistant = await this.openai.beta.assistants.retrieve(this._options.assistant_id);
        }

        return this._assistant;
    }

    protected async createMessage(thread_id: string, body: OpenAI.Beta.Threads.Messages.MessageCreateParams): Promise<OpenAI.Beta.Threads.Messages.ThreadMessage> {
        return await this.openai.beta.threads.messages.create(thread_id, body);
    }

    protected async createThread(request: OpenAI.Beta.Threads.ThreadCreateParams): Promise<OpenAI.Beta.Threads.Thread> {
        return await this.openai.beta.threads.create(request);
    }

    protected async listMessages(thread_id: string): Promise<OpenAI.Beta.Threads.Messages.ThreadMessagesPage> {
        return await this.openai.beta.threads.messages.list(thread_id);
    }

    protected async createRun(thread_id: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
        return await this.openai.beta.threads.runs.create(
            thread_id,
            {
              assistant_id: this._options.assistant_id
            }
        );
    }

    protected async retrieveRun(thread_id: string, run_id: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
        return await this.openai.beta.threads.runs.retrieve(
            thread_id,
            run_id
        );
    }

    protected async retrieveLastRun(thread_id: string): Promise<OpenAI.Beta.Threads.Runs.Run|null> {
        const list = await this.openai.beta.threads.runs.list(thread_id, { limit: 1 });
        if (list.data.length > 0) {
            return list.data[0];
        }

        return null;
    }

    protected async submitToolOutputs(thread_id: string, run_id: string, tool_outputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams): Promise<OpenAI.Beta.Threads.Runs.Run> {
        return await this.openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, tool_outputs);
    }

    protected isRunCompleted(run: OpenAI.Beta.Threads.Runs.Run): boolean {
        switch (run.status) {
            case 'completed':
            case 'failed':
            case 'cancelled':
            case 'expired':
                return true;
        }

        return false;
    }

    protected async waitForRun(thread_id: string, run_id: string, handleActions = false): Promise<OpenAI.Beta.Threads.Runs.Run> {
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
            tool_outputs.push({ tool_call_id, output });
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
                throw new Error(`Run failed ${results.status}`);
        }
    }

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
                throw new Error(`Run failed ${results.status}`);
        }
    }

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

    private updateAssistantsState(state: TState, assistants_state: AssistantsState): void {
        state.setValue(this._options.assistants_state_variable!, assistants_state);
    }

    private async ensureThreadCreated(state: TState, input: string): Promise<string> {
        const assistants_state = this.ensureAssistantsState(state);
        if (assistants_state.thread_id == null) {
            const thread = await this.createThread({});
            assistants_state.thread_id = thread.id;
            this.updateAssistantsState(state, assistants_state);
        }

        return assistants_state.thread_id;
    }

    private async blockOnInprogressRuns(thread_id: string): Promise<void> {
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

interface AssistantsState {
    thread_id: string|null;
    run_id: string|null;
    last_message_id: string|null;
}