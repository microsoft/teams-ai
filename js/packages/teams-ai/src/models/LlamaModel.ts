import axios, { AxiosInstance } from 'axios';
import { TurnContext } from 'botbuilder';

import { Colorize } from '../internals/Colorize';
import { Memory } from '../MemoryFork';
import { PromptCompletionModel } from '../models';
import { Message, PromptFunctions, PromptTemplate } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { PromptResponse } from '../types';

export interface LlamaModelOptions {
    apiKey: string;
    endpoint: string;
    logRequests?: boolean;
}

export class LlamaModel implements PromptCompletionModel {
    private readonly _httpClient: AxiosInstance;

    public constructor(public readonly options: LlamaModelOptions) {
        // Create client
        this._httpClient = axios.create({
            validateStatus: (status) => status < 400 || status == 429,
            headers: {
                Authorization: `Bearer ${options.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': '@microsoft/teams-ai-v1'
            }
        });
    }

    public async completePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate
    ): Promise<PromptResponse<string>> {
        const max_input_tokens = template.config.completion.max_input_tokens;
        const result = await template.prompt.renderAsMessages(context, memory, functions, tokenizer, max_input_tokens);

        if (result.tooLong) {
            return {
                status: 'too_long',
                error: new Error('The generated prompt length was too long')
            };
        }

        let last: Message | undefined = result.output[result.output.length - 1];
        if (last?.role !== 'user') {
            last = undefined;
        }
        let res;

        if (this.options.logRequests) {
            console.log(Colorize.title('CHAT PROMPT:'));
            console.log(Colorize.output(result.output));
        }

        try {
            res = await this._httpClient.post<{ output: string }>(this.options.endpoint, {
                input_data: {
                    input_string: result.output,
                    parameters: template.config.completion
                }
            });
            if (this.options.logRequests) {
                console.log(Colorize.title('CHAT RESPONSE:'));
                console.log(Colorize.value('status', res.status));
                console.log(Colorize.output(res.data.output));
            }
        } catch (err) {
            console.error(err);
            throw err;
        }

        return {
            status: 'success',
            input: last,
            message: {
                role: 'assistant',
                content: res!.data.output
            }
        };
    }
}
