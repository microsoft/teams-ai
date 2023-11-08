import { TurnContext } from 'botbuilder';
import { ActionPlanner, Application } from '@microsoft/teams-ai';
import { ApplicationTurnState, IDataEntities, trimPromptResponse, updateDMResponse } from '../bot';
import * as responses from '../responses';

/**
 * @param {Application<ApplicationTurnState>} app The bot's application object.
 */
export function mapAction(app: Application<ApplicationTurnState>, planner: ActionPlanner<ApplicationTurnState>): void {
    app.ai.action('map', async (context: TurnContext, state: ApplicationTurnState, data: IDataEntities) => {
        const action = (data.operation ?? '').toLowerCase();
        switch (action) {
            case 'query':
                return await queryMap(app, context, state);
            default:
                await context.sendActivity(`[map.${action}]`);
                return '';
        }
    });
}

/**
 * @param {Application} app The bot's application object.
 * @param {TurnContext} context The current turn context.
 * @param {ApplicationTurnState} state The current application state.
 * @returns {Promise<boolean>} A boolean indicating whether the query was successful.
 */
async function queryMap(
    app: Application<ApplicationTurnState>,
    context: TurnContext,
    state: ApplicationTurnState
): Promise<string> {
    // Use the map to answer player
    // const newResponse = await app.ai.completePrompt(context, state, 'useMap');
    // if (newResponse) {
    //     await updateDMResponse(context, state, trimPromptResponse(newResponse).split('\n').join('<br>'));
    //     state.temp.playerAnswered = true;
    // } else {
    //     await updateDMResponse(context, state, responses.dataError());
    // }

    return '';
}
