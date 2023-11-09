import { TurnContext } from 'botbuilder';
import { ActionPlanner, Application } from '@microsoft/teams-ai';
import { ApplicationTurnState, IDataEntities } from '../bot';

/**
 * @param {Application<ApplicationTurnState>} app - The application instance.
 */
export function storyAction(app: Application<ApplicationTurnState>, planner: ActionPlanner<ApplicationTurnState>): void {
    app.ai.action('story', async (context: TurnContext, state: ApplicationTurnState, data: IDataEntities) => {
        const action = (data.operation ?? '').toLowerCase();
        switch (action) {
            case 'change':
            case 'update':
                return await updateStory(context, state, data);
            default:
                await context.sendActivity(`[story.${action}]`);
                return '';
        }
    });
}

/**
 * Updates the story in the conversation state.
 * @param {TurnContext} context - The context object for the turn.
 * @param {ApplicationTurnState} state - The state object for the application.
 * @param {IDataEntities} data - The data object for the turn.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the update was successful.
 */
async function updateStory(context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<string> {
    const description = (data.description ?? '').trim();
    if (description.length > 0) {
        // Write story change to conversation state
        state.conversation.story = description;
    }

    return '';
}
