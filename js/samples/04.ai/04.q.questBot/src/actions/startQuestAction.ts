import { Application, ConversationHistory, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, describeGameState, describeMoveExamples, describeSurroundings, updateDMResponse } from "../bot";
import { quests, map } from "../ShadowFalls";
import * as responses from '../responses';
import * as prompts from '../prompts';

export function startQuestAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('startQuest', async (context, state) => {
        // GPT will sometimes call startQuest a second time at the beginning of quest so ignore
        // - It's picking this up from the conversation history.
        const conversation = state.conversation.value;
        if (conversation.inQuest) {
            return true;
        }
    
        // Start with a clean slate chat history wise.
        ConversationHistory.clear(state);
    
        // Start a new quest
        const questIndex = 0;
        const quest = quests[questIndex];
        const location = map.locations[quest.startLocation];
        conversation.inQuest = true;
        conversation.turn = 0;
        conversation.questIndex = questIndex;
        conversation.locationId = location.id;
        conversation.locationTurn = 0;
        conversation.dropped = {};
        conversation.droppedTurn = 0;
        conversation.dynamicLocation = undefined;
    
        // Load temp variables for prompt use
        const temp = state.temp.value
        temp.quest = `\tTitle: "${quest.title}"\n\tBackstory: ${quest.backstory}`;
        temp.location = location.details;
        temp.mapPaths = location.mapPaths;
        temp.surroundings = describeSurroundings(location);
        temp.gameState = describeGameState(conversation);
        temp.dynamicExamples = describeMoveExamples(location);
    
        // Generate quest intro
        const intro = await predictionEngine.prompt(context, state, prompts.startQuest);
        await context.sendActivity(`<b>${quest.title}</b>`);
        if (intro) {
            await updateDMResponse(context, state, intro);
        } else {
            await updateDMResponse(context, state, responses.dataError());
        }
    
        return false;
    });
}