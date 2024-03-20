/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PromptSection } from './PromptSection';
import { ChatCompletionAction } from '../models';
import { Augmentation } from '../augmentations';
import { AzureOpenAIChatCompletionDataSources } from '../internals/types';

/**
 * Prompt template cached by the prompt manager.
 */
export interface PromptTemplate {
    /**
     * Name of the prompt template.
     */
    name: string;

    /**
     * Text of the prompt template.
     */
    prompt: PromptSection;

    /**
     * Configuration settings for the prompt template.
     */
    config: PromptTemplateConfig;

    /**
     * Optional list of actions the model may generate JSON inputs for.
     */
    actions?: ChatCompletionAction[];

    /**
     * Optional augmentation for the prompt template.
     */
    augmentation?: Augmentation;
}

/**
 * Serialized prompt template configuration.
 */
export interface PromptTemplateConfig {
    /**
     * The schema version of the prompt template. Can be '1', '1.1' or '1.2'.
     */
    schema: number;

    /**
     * Type of prompt template. Should always be 'completion'.
     */
    type: 'completion';

    /**
     * Completion settings for the prompt.
     */
    completion: CompletionConfig;

    /**
     * Optional. Augmentation settings for the prompt.
     * @remarks
     * New in schema version 1.1.
     */
    augmentation?: AugmentationConfig;

    /**
     * Optional. Description of the prompts purpose.
     */
    description?: string;

    /**
     * @deprecated Use `completion.model` instead.
     * Optional. Array of backends (models) to use for the prompt.
     * @remarks
     * Passing the name of a model to use here will override the default model used by a planner.
     */
    default_backends?: string[];
}

/**
 * Interface for the completion configuration portion of a prompt template.
 */
export interface CompletionConfig {
    /**
     * Optional. Type of completion to use. Defaults to using the completion type of the configured default model.
     */
    completion_type?: 'chat' | 'text';

    /**
     * The models frequency_penalty as a number between 0 and 1.
     * @remarks
     * Defaults to 0.
     */
    frequency_penalty: number;

    /**
     * If true, the prompt will be augmented with the conversation history.
     * @remarks
     * Defaults to true.
     */
    include_history: boolean;

    /**
     * If true, the prompt will be augmented with the users input.
     * @remarks
     * Defaults to true.
     */
    include_input: boolean;

    /**
     * If true, the prompt will be augmented with any images uploaded by the user.
     * @remarks
     * Defaults to false.
     */
    include_images: boolean;

    /**
     * The maximum number of tokens to generate.
     * @remarks
     * Defaults to 150.
     */
    max_tokens: number;

    /**
     * The maximum number of tokens allowed in the input.
     * @remarks
     * Defaults to 2048.
     */
    max_input_tokens: number;

    /**
     * Optional. Name of the model to use otherwise the configured default model is used.
     * @remarks
     */
    model?: string;

    /**
     * The models presence_penalty as a number between 0 and 1.
     * @remarks
     * Defaults to 0.
     */
    presence_penalty: number;

    /**
     * Optional. Array of stop sequences that when hit will stop generation.
     */
    stop_sequences?: string[];

    /**
     * The models temperature as a number between 0 and 2.
     * @remarks
     * Defaults to 0.
     */
    temperature: number;

    /**
     * The models top_p as a number between 0 and 2.
     * @remarks
     * Defaults to 0.
     */
    top_p: number;

    // TODO: Figure out a way to not expose an interal type here.
    /**
     * Optional. List of data sources to augment the prompt with.
     * @remarks
     * New in schema version 1.2.
     * This is specific to Azure OpenAI Chat Completions API version `2024-02-15-preview` onwards. The `completion_type` must be set to 'chat'.
     */
    data_sources?: AzureOpenAIChatCompletionDataSources[];
}

/**
 * Interface for the augmentation configuration portion of a prompt template.
 * @remarks
 * New in schema version 1.1.
 */
export interface AugmentationConfig {
    /**
     * The type of augmentation to use.
     */
    augmentation_type: 'none' | 'sequence' | 'monologue';

    /**
     * Optional. List of named data sources to augment the prompt with.
     * @remarks
     * For each data source, the value is the max number of tokens to use from the data source.
     */
    data_sources?: { [name: string]: number };
}
