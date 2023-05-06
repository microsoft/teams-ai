import { TurnContext } from 'botbuilder';
import { Application, ResponseParser } from '@microsoft/botbuilder-m365';
import {
    ApplicationTurnState,
    DEFAULT_BACKSTORY,
    DEFAULT_EQUIPPED,
    IDataEntities,
    updateDMResponse,
    UserState
} from '../teamsBot';
import * as responses from '../responses';

/**
 * @param app
 */
export function playerAction(app: Application<ApplicationTurnState>): void {
    app.ai.action('player', async (context: TurnContext, state: ApplicationTurnState, data: IDataEntities) => {
        const action = (data.operation ?? '').toLowerCase();
        switch (action) {
            case 'update':
                return await updatePlayer(app, context, state, data);
            default:
                await context.sendActivity(`[player.${action}]`);
                return true;
        }
    });
}

/**
 * @param app
 * @param context
 * @param state
 * @param data
 */
async function updatePlayer(
    app: Application<ApplicationTurnState>,
    context: TurnContext,
    state: ApplicationTurnState,
    data: IDataEntities
): Promise<boolean> {
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
            conversation.players.push(newName);
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
        state.temp.value.backstoryChange = backstoryChange ?? 'no change';
        state.temp.value.equippedChange = equippedChange ?? 'no change';
        const update = (await app.ai.completePrompt(context, state, 'updatePlayer')) as string;
        const obj: UserState = ResponseParser.parseJSON(update) || {} as UserState;
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

    // Save player changes
    state.user.value.name = player.name;
    state.user.value.backstory = player.backstory;
    state.user.value.equipped = player.equipped;

    // Build message
    let message = `🤴 <strong>${player.name}</strong>`;
    if (backstoryChange.length > 0) {
        message += `<br><strong>Backstory:</strong> ${player.backstory.split('\n').join('<br>')}`;
    }
    if (equippedChange.length > 0) {
        message += `<br><strong>Equipped:</strong> ${player.equipped.split('\n').join('<br>')}`;
    }

    await context.sendActivity(message);
    state.temp.value.playerAnswered = true;

    return true;
}
