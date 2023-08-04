import { Application, OpenAIPlanner } from '@microsoft/teams-ai';
import { ApplicationTurnState } from '../bot';
import { inventoryAction } from './inventoryAction';
import { locationAction } from './locationAction';
import { mapAction } from './mapAction';
import { playerAction } from './playerAction';
import { questAction } from './questAction';
import { storyAction } from './storyAction';
import { timeAction } from './timeAction';

/**
 * Adds all the actions to the given application.
 * @param {Application<ApplicationTurnState>} app The application to add the actions to.
 */
export function addActions(app: Application<ApplicationTurnState>): void {
    inventoryAction(app);
    locationAction(app);
    mapAction(app);
    playerAction(app);
    questAction(app);
    storyAction(app);
    timeAction(app);
}
