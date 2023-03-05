import { TurnContext } from "botbuilder";
import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState, IDataEntities, parseNumber, updateDMResponse } from "../bot";
import { describeConditions, describeSeason, describeTimeOfDay, generateTemperature, generateWeather } from "../conditions";

export function timeAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('time', async (context, state, data: IDataEntities) => {
        const action = (data.action ?? '').toLowerCase();
        switch (action) {
            case 'wait':
                return await waitForTime(context, state, data);
            default:
                await context.sendActivity(`[time.${action}]`);
                return true;
        }
    });
}

async function waitForTime(context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    const until = (data.until ?? '').toLowerCase();
    const days = parseNumber(data.days, 0);
    const conversation = state.conversation.value;
    if (until) {
        let notification = '';
        conversation.day += days;
        switch (until) {
            case 'dawn':
                conversation.time = 4;
                if (days < 2) {
                    notification = `⏳ crack of dawn`
                }
                break;
            case 'morning':
            default:
                conversation.time = 6;
                if (days == 0) {
                    notification = `⏳ early morning`;
                } else if (days == 1) {
                    notification = `⏳ the next morning`;
                }
                break;
            case 'noon':
                conversation.time = 12;
                if (days == 0) {
                    notification = `⏳ today at noon`;
                } else if (days == 1) {
                    notification = `⏳ tomorrow at noon`;
                }
                break;
            case 'afternoon':
                conversation.time = 14;
                if (days == 0) {
                    notification = `⏳ this afternoon`;
                } else if (days == 1) {
                    notification = `⏳ tomorrow afternoon`;
                }
                break;
            case 'evening':
                conversation.time = 18;
                if (days == 0) {
                    notification = `⏳ this evening`;
                } else if (days == 1) {
                    notification = `⏳ tomorrow evening`;
                }
                break;
            case 'night':
                conversation.time = 20;
                if (days == 0) {
                    notification = `⏳ tonight`;
                } else if (days == 1) {
                    notification = `⏳ tomorrow night`;
                }
                break;
        }

        // Update temp state
        state.temp.value.timeOfDay = describeTimeOfDay(conversation.time);
        state.temp.value.season = describeSeason(conversation.day);

        // Generate new weather
        if (days > 0) {
            conversation.temperature = generateTemperature(state.temp.value.season)
            conversation.weather = generateWeather(state.temp.value.season);
            conversation.nextEncounterTurn = conversation.turn + Math.floor(Math.random() * 5) + 1;
        }

        // Update conditions
        state.temp.value.conditions = describeConditions(conversation.time, conversation.day, conversation.temperature, conversation.weather);

        // Notify player
        // - We don't consider this answering the players query. We want the story to be included
        //   for added color.
        await context.sendActivity(notification ? notification : `⏳ ${days} days later`);
    } else {
        // If the model calls "time action='wait'"" without any options, just return the current time of day.
        await updateDMResponse(context, state, `⏳ it's ${state.temp.value.timeOfDay}`);
        return false;
    }
    return true;
}