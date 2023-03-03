import { Application, ConversationHistory, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, describeGameState, describeItemList, describeMoveExamples, describeSurroundings, updateDMResponse } from "../bot";
import { quests, map } from "../ShadowFalls";
import * as responses from '../responses';
import * as prompts from '../prompts';
import { describeConditions, generateTemperature, describeTimeOfDay, generateWeather, describeSeason, } from "../conditions";

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
        conversation.nextEncounterTurn = 5;
        conversation.dropped = {};
        conversation.droppedTurn = 0;
        conversation.dynamicLocation = undefined;
        conversation.day = Math.floor(Math.random() * 365) + 1;
        conversation.time = 6.0;
    
        // Load temp variables for prompt use
        const temp = state.temp.value
        temp.quest = `"${quest.title}" - ${quest.backstory}`;
        temp.location = `${location.name} - ${location.details}`;
        temp.mapPaths = location.mapPaths;
        temp.gameState = describeGameState(conversation);
        temp.surroundings = describeSurroundings(location);
        temp.gameState = describeGameState(conversation);
        temp.dynamicExamples = describeMoveExamples(location);
        temp.timeOfDay = describeTimeOfDay(conversation.time);
        temp.season = describeSeason(conversation.day);
        temp.conversation = '';
        temp.droppedItems = describeItemList(conversation.dropped);
        
        // Generate weather
        conversation.temperature = generateTemperature(temp.season);
        conversation.weather = generateWeather(temp.season);
        temp.conditions = describeConditions(conversation.time, conversation.day, conversation.temperature, conversation.weather);
        
        // Generate quest intro
        const intro = await predictionEngine.prompt(context, state, prompts.startQuest);
        if (intro) {
            conversation.story = intro;
            await context.sendActivity(`<b>${quest.title}</b><br>${intro.split('\n').join('<br>')}`);

            // Update conversation history
            ConversationHistory.addLine(state, `DM: ${intro}`);
        } else {
            await updateDMResponse(context, state, responses.dataError());
        }
    
        return false;
    });
}