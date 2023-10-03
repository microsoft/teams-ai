/* eslint-disable security/detect-object-injection */
import { TurnContext } from 'botbuilder';
import { Application } from '@microsoft/teams-ai';
import { ApplicationTurnState, IDataEntities, IQuest } from '../bot';

/**
 * @param {Application<ApplicationTurnState>} app - The application instance.
 */
export function questAction(app: Application<ApplicationTurnState>): void {
    app.ai.action('quest', async (context: TurnContext, state: ApplicationTurnState, data: IDataEntities) => {
        const action = (data.operation ?? '').toLowerCase();
        switch (action) {
            case 'add':
            case 'update':
                return await updateQuest(app, context, state, data);
            case 'remove':
                return await removeQuest(state, data);
            case 'finish':
                return await finishQuest(state, data);
            case 'list':
                return await listQuest(context, state);
            default:
                await context.sendActivity(`[quest.${action}]`);
                return true;
        }
    });
}

/**
 * Updates a quest.
 * @param {Application<ApplicationTurnState>} app - The application instance.
 * @param {TurnContext} context - The context object for the turn.
 * @param {ApplicationTurnState} state - The state object for the turn.
 * @param {IDataEntities} data - The data entities for the turn.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the operation was successful.
 */
async function updateQuest(
    app: Application<ApplicationTurnState>,
    context: TurnContext,
    state: ApplicationTurnState,
    data: IDataEntities
): Promise<boolean> {
    const conversation = state.conversation.value;
    const quests = conversation.quests ?? {};

    // Create new quest
    const title = (data.title ?? '').trim();
    const quest: IQuest = {
        title: title,
        description: (data.description ?? '').trim()
    };

    // Expand quest details
    const details = await app.ai.completePrompt(context, state, 'questDetails');
    if (details) {
        quest.description = details.trim();
    }

    // Add quest to collection of active quests
    quests[quest.title.toLowerCase()] = quest;

    // Save updated location to conversation
    conversation.quests = quests;

    // Tell use they have a new/updated quest
    await context.sendActivity(printQuest(quest));
    state.temp.value.playerAnswered = true;

    return true;
}

/**
 * Removes a quest.
 * @param {ApplicationTurnState} state - The state object for the turn.
 * @param {IDataEntities} data - The data entities for the turn.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the operation was successful.
 */
async function removeQuest(state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    const conversation = state.conversation.value;

    // Find quest and delete it
    const quests = conversation.quests ?? {};
    const title = (data.title ?? '').trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(quests, title)) {
        delete quests[title];
        conversation.quests = quests;
    }

    return true;
}

/**
 * Deletes a quest from the conversation and marks the corresponding campaign objective as completed if applicable.
 * @param {ApplicationTurnState} state The state object for the current turn of conversation.
 * @param {IDataEntities} data The data entities for the current turn of conversation.
 * @returns {Promise<boolean>} A promise that resolves to true if the quest was finished successfully, or false otherwise.
 */
async function finishQuest(state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    const conversation = state.conversation.value;

    // Find quest and delete item
    const quests = conversation.quests ?? {};
    const title = (data.title ?? '').trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(quests, title)) {
        const quest = quests[title];
        delete quests[title];
        conversation.quests = quests;

        // Check for the completion of a campaign objective
        const campaign = conversation.campaign;
        if (campaign && Array.isArray(campaign.objectives)) {
            for (let i = 0; i < campaign.objectives.length; i++) {
                const objective = campaign.objectives[i];
                if (objective.title.toLowerCase() == title) {
                    objective.completed = true;
                    break;
                }
            }
        }
    }

    return true;
}

/**
 * Lists all quests in the conversation and sends them to the user.
 * @param {TurnContext} context - The context object for the turn.
 * @param {ApplicationTurnState} state - The state object for the turn.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the operation was successful.
 */
async function listQuest(context: TurnContext, state: ApplicationTurnState): Promise<boolean> {
    const conversation = state.conversation.value;
    const quests = conversation.quests ?? {};

    let text = '';
    let connector = '';
    for (const key in quests) {
        const quest = quests[key];
        text += connector + printQuest(quest);
        connector = '<br>';
    }

    // Show player list of quests
    if (text.length > 0) {
        await context.sendActivity(text);
    }

    state.temp.value.playerAnswered = true;
    return true;
}

/**
 * Prints the details of a quest.
 * @param {IQuest} quest - The quest object to print.
 * @returns {string} - A string containing the formatted details of the quest.
 */
function printQuest(quest: IQuest): string {
    return `✨ <strong>${quest.title}</strong><br>${quest.description.split('\n').join('<br>')}`;
}
