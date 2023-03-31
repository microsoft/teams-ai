import { TurnContext } from 'botbuilder';
import { Application } from '@microsoft/botbuilder-m365';
import { ApplicationTurnState, IDataEntities, IQuest } from '../bot';

/**
 * @param app
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
 * @param app
 * @param context
 * @param state
 * @param data
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
 * @param state
 * @param data
 */
async function removeQuest(state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    const conversation = state.conversation.value;

    // Find quest and delete it
    const quests = conversation.quests ?? {};
    const title = (data.title ?? '').trim().toLowerCase();
    if (quests.hasOwnProperty(title)) {
        delete quests[title];
        conversation.quests = quests;
    }

    return true;
}

/**
 * @param state
 * @param data
 */
async function finishQuest(state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    const conversation = state.conversation.value;

    // Find quest and delete item
    const quests = conversation.quests ?? {};
    const title = (data.title ?? '').trim().toLowerCase();
    if (quests.hasOwnProperty(title)) {
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
 * @param context
 * @param state
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
 * @param quest
 */
function printQuest(quest: IQuest): string {
    return `✨ <strong>${quest.title}</strong><br>${quest.description.split('\n').join('<br>')}`;
}
