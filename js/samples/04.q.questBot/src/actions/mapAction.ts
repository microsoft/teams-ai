import { TurnContext } from 'botbuilder';
import { Application, OpenAIPlanner } from 'botbuilder-m365';
import { ApplicationTurnState, IDataEntities, trimPromptResponse, updateDMResponse } from '../bot';
import * as responses from '../responses';
import * as prompts from '../prompts';

/**
 * @param app
 * @param planner
 */
export function mapAction(app: Application<ApplicationTurnState>, planner: OpenAIPlanner): void {
    app.ai.action('map', async (context, state, data: IDataEntities) => {
        const action = (data.operation ?? '').toLowerCase();
        switch (action) {
            case 'query':
                return await queryMap(planner, context, state);
            default:
                await context.sendActivity(`[map.${action}]`);
                return true;
        }
    });
}

/**
 * @param planner
 * @param context
 * @param state
 */
async function queryMap(planner: OpenAIPlanner, context: TurnContext, state: ApplicationTurnState): Promise<boolean> {
    // Use the map to answer player
    const newResponse = await planner.prompt(context, state, prompts.useMap);
    if (newResponse) {
        await updateDMResponse(context, state, trimPromptResponse(newResponse).split('\n').join('<br>'));
        state.temp.value.playerAnswered = true;
    } else {
        await updateDMResponse(context, state, responses.dataError());
    }

    return false;
}
