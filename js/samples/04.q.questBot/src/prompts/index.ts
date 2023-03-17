import { OpenAIPromptOptions } from 'botbuilder-m365';
import * as path from 'path';

/**
 * @param name
 */
export function getPromptPath(name: string): string {
    return path.join(__dirname, '../../src/prompts/', name);
}

export const createCampaign: OpenAIPromptOptions = {
    prompt: getPromptPath('createCampaign.txt'),
    promptConfig: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

export const findDifferences: OpenAIPromptOptions = {
    prompt: getPromptPath('findDifferences.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.0,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    }
};

export const help: OpenAIPromptOptions = {
    prompt: getPromptPath('help.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

export const intro: OpenAIPromptOptions = {
    prompt: getPromptPath('intro.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

export const listItems: OpenAIPromptOptions = {
    prompt: getPromptPath('listItems.txt'),
    promptConfig: {
        model: 'gpt-3.5-turbo',
        temperature: 0.2,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    }
};

export const newObjective: OpenAIPromptOptions = {
    prompt: getPromptPath('newObjective.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    }
};

export const prompt: OpenAIPromptOptions = {
    prompt: getPromptPath('prompt.txt'),
    promptConfig: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

export const questDetails: OpenAIPromptOptions = {
    prompt: getPromptPath('questDetails.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.9,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    }
};

export const updatePlayer: OpenAIPromptOptions = {
    prompt: getPromptPath('updatePlayer.txt'),
    promptConfig: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

export const useMap: OpenAIPromptOptions = {
    prompt: getPromptPath('useMap.txt'),
    promptConfig: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};
