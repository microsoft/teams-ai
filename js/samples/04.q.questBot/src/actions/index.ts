import { Application, OpenAIPlanner } from "botbuilder-m365";
import { ApplicationTurnState } from "../bot";
import { inventoryAction } from "./inventoryAction";
import { locationAction } from "./locationAction";
import { mapAction } from "./mapAction";
import { playerAction } from "./playerAction";
import { questAction } from "./questAction";
import { storyAction } from "./storyAction";
import { timeAction } from "./timeAction";

export function addActions(app: Application<ApplicationTurnState>, planner: OpenAIPlanner): void {
    inventoryAction(app, planner);
    locationAction(app, planner);
    mapAction(app, planner);
    playerAction(app, planner);
    questAction(app, planner);
    storyAction(app, planner);
    timeAction(app, planner);
 }