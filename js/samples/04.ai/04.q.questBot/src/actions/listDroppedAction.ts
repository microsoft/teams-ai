import { Application, OpenAIPredictionEngine, ResponseParser } from "botbuilder-m365";
import { MessageFactory, CardFactory } from 'botbuilder';
import { ApplicationTurnState, trimPromptResponse, updateDMResponse } from "../bot";
import * as responses from '../responses';
import * as prompts from '../prompts';

export function listDroppedAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('listDropped', async (context, state) => {
        const items = state.conversation.value.dropped ?? {};
        if (Object.keys(items).length > 0) {
            state.temp.value.listItems = items;
            state.temp.value.listType = 'dropped';
            const newResponse = await predictionEngine.prompt(context, state, prompts.listItems);
            if (newResponse) {
                const card = ResponseParser.parseAdaptiveCard(newResponse);
                if (card) {
                    await context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(card)));
                } else {
                    await updateDMResponse(context, state, trimPromptResponse(newResponse).split('\n').join('<br>'));
                }
            } else {
                await updateDMResponse(context, state, responses.dataError());
            }
        } else {
            await updateDMResponse(context, state, responses.emptyInventory());
            return false;
        }
    
        return true;
    });
}