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
import { CompletionConfig } from '../types';

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
     * The schema version of the prompt template. Can be '1' or '1.1'.
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
