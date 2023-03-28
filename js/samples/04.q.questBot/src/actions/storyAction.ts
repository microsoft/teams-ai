import { TurnContext } from 'botbuilder';
import { Application } from 'botbuilder-m365';
import { ApplicationTurnState, IDataEntities } from '../bot';

/**
 * @param app
 */
export function storyAction(app: Application<ApplicationTurnState>): void {
    app.ai.action('story', async (context, state, data: IDataEntities) => {
        const action = (data.operation ?? '').toLowerCase();
        switch (action) {
            case 'change':
            case 'update':
                return await updateStory(context, state, data);
            default:
                await context.sendActivity(`[story.${action}]`);
                return true;
        }
    });
}

/**
 * @param context
 * @param state
 * @param data
 */
async function updateStory(context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    const description = (data.description ?? '').trim();
    if (description.length > 0) {
        // Write story change to conversation state
        state.conversation.value.story = description;
    }

    return true;
}
