import { OpenAIPromptOptions } from "botbuilder-m365";
import * as path from 'path';

export function getPromptPath(name: string): string {
    return path.join(__dirname, '../../src/prompts/', name);
}

export const createLocation: OpenAIPromptOptions = {
    prompt: getPromptPath('createLocation.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

export const listItems: OpenAIPromptOptions = {
    prompt: getPromptPath('listItems.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.2,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    }
};

export const newLocation: OpenAIPromptOptions = {
    prompt: getPromptPath('newLocation.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6
    }
};

export const preQuest: OpenAIPromptOptions = {
    prompt: getPromptPath('preQuest.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.4,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Player:', ' DM:']
    }
};

export const prompt: OpenAIPromptOptions = {
    prompt: getPromptPath('prompt.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.4,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Player:', ' DM:']
    }
};

export const startQuest: OpenAIPromptOptions = {
    prompt: getPromptPath('startQuest.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Player:', ' DM:']
    }
};

export const useMap: OpenAIPromptOptions = {
    prompt: getPromptPath('useMap.txt'),
    promptConfig: {
        model: 'text-davinci-003',
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [' Player:', ' DM:']
    }
};
