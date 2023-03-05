import { TurnContext } from "botbuilder";
import { Application, OpenAIPredictionEngine, ResponseParser } from "botbuilder-m365";
import { ApplicationTurnState, DEFAULT_BACKSTORY, DEFAULT_EQUIPPED, IDataEntities,  updateDMResponse, UserState } from "../bot";
import * as responses from '../responses';
import * as prompts from '../prompts';

export function playerAction(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action('player', async (context, state, data: IDataEntities) => {
        const action = (data.action ?? '').toLowerCase();
        switch (action) {
            case 'update':
                return await updatePlayer(predictionEngine, context, state, data);
            default:
                await context.sendActivity(`[player.${action}]`);
                return true;
        }
    });
}

async function updatePlayer(predictionEngine: OpenAIPredictionEngine, context: TurnContext, state: ApplicationTurnState, data: IDataEntities): Promise<boolean> {
    // Check for name change
    const player = Object.assign({}, state.user.value);
    const newName = (data.name ?? '').trim();
    if (newName) {
        // Update players for current session
        const conversation = state.conversation.value;
        if (Array.isArray(conversation.players)) {
            const pos = conversation.players.indexOf(player.name);
            if (pos >= 0) {
                conversation.players.splice(pos, 1);
            }
            conversation.players.push(newName)
        }

        // Update name and notify user        
        player.name = newName;
    }

    // Check for change or default values
    // - Lets update everything on first name change
    let backstoryChange = (data.backstory ?? '').trim();
    if (backstoryChange.length == 0 && player.backstory == DEFAULT_BACKSTORY) {
        backstoryChange = player.backstory;
    }

    let equippedChange = (data.equipped ?? '').trim();
    if (equippedChange.length == 0 && player.equipped == DEFAULT_EQUIPPED) {
        equippedChange = player.equipped;
    }

    // Update backstory and equipped 
    if (backstoryChange.length > 0 || equippedChange.length > 0) {
        state.temp.value.playerInfo = JSON.stringify({
            name: player.name,
            backstory: player.backstory,
            equipped: player.equipped
        })
        state.temp.value.backstoryChange = backstoryChange ?? 'no change';
        state.temp.value.equippedChange = equippedChange ?? 'no change';
        const update = await predictionEngine.prompt(context, state, prompts.updatePlayer);
        const obj: UserState = ResponseParser.parseJSON(update);
        if (obj) {
            if (obj.backstory?.length > 0) {
                player.backstory = obj.backstory;
            }

            if (obj.equipped?.length > 0) {
                player.equipped = obj.equipped;
            }
        } else {
            await updateDMResponse(context, state, responses.dataError());
            return false;
        }
    }


    state.user.value.name = player.name;
    state.user.value.backstory = player.backstory;
    state.user.value.equipped = player.equipped;
    const backstory = player.backstory.split('\n').join('<br>');
    const equipped = player.equipped.split('\n').join('<br>')
    await context.sendActivity(`🤴 <b>${player.name}</b><br><b>Backstory:</b> ${backstory}<br><b>Equipped:</b> ${equipped}`);
    state.temp.value.playerAnswered = true;
    
    return true;
}