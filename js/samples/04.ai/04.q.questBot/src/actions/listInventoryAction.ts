import { Application, OpenAIPredictionEngine, ResponseParser } from "botbuilder-m365";
import { MessageFactory, CardFactory } from 'botbuilder';
import { ApplicationTurnState, trimPromptResponse, updateDMResponse } from "../bot";
import * as responses from '../responses';
import * as prompts from '../prompts';

export function listInventoryAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('listInventory', async (context, state) => {
        const items = state.user.value.inventory ?? {};
        if (Object.keys(items).length > 0) {
            state.temp.value.listItems = items;
            state.temp.value.listType = 'inventory';
            const newResponse = await predictionEngine.prompt(context, state, prompts.listItems);
            if (newResponse) {
                const card = ResponseParser.parseAdaptiveCard(newResponse);
                if (card) {
                    await context.sendActivity(MessageFactory.attachment(CardFactory.adaptiveCard(card)));
                } else {
                    await updateDMResponse(context, state, trimPromptResponse(newResponse));
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