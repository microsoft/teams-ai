import { TurnContext } from "botbuilder";
import { DefaultConversationState, DefaultTempState, DefaultTurnState, DefaultUserState } from "./DefaultTurnStateManager";
import { PromptManager, PromptTemplate } from "./Prompts";


/**
 * A prompt manager used for testing.
 */
export class TestPromptManager implements PromptManager<DefaultTurnState> {
    public readonly functions: Map<string, (context: TurnContext, state: DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>) => Promise<any>> = new Map();
    public readonly templates: Map<string, PromptTemplate> = new Map();

    public addFunction(name: string, handler: (context: TurnContext, state: DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>) => Promise<any>, allowOverrides?: boolean | undefined): this {
        this.functions.set(name, handler);
        return this;
    }

    public addPromptTemplate(name: string, template: PromptTemplate): this {
        this.templates.set(name, template);
        return this;
    }

    public invokeFunction(context: TurnContext, state: DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>, name: string): Promise<any> {
        if (this.functions.has(name)) {
            return this.functions.get(name)!(context, state);
        } else {
            throw new Error(`Function ${name} not found.`);
        }
    }

    public renderPrompt(context: TurnContext, state: DefaultTurnState<DefaultConversationState, DefaultUserState, DefaultTempState>, nameOrTemplate: string | PromptTemplate): Promise<PromptTemplate> {
        if (typeof nameOrTemplate === 'string') {
            if (this.templates.has(nameOrTemplate)) {
                return Promise.resolve(this.templates.get(nameOrTemplate)!);
            } else {
                throw new Error(`Template ${nameOrTemplate} not found.`);
            }
        } else {
            return Promise.resolve(nameOrTemplate);
        }
    }
}
