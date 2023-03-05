import { OpenAIPromptOptions } from "botbuilder-m365";
import * as path from 'path';

export function getPromptPath(name: string): string {
    return path.join(__dirname, '../../src/prompts/', name);
}

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


export const prompt: OpenAIPromptOptions = {
    prompt: getPromptPath('prompt.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Player:', ' DM:']
    }
};

export const updateBackstory: OpenAIPromptOptions = {
    prompt: getPromptPath('updateBackstory.txt'),
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
