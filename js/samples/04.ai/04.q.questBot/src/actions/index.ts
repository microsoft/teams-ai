import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState } from "../bot";
import { inventoryAction } from "./inventoryAction";
import { locationAction } from "./locationAction";
import { mapAction } from "./mapAction";
import { playerAction } from "./playerAction";
import { questAction } from "./questAction";
import { storyAction } from "./storyAction";
import { timeAction } from "./timeAction";

export function addActions(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    inventoryAction(app, predictionEngine);
    locationAction(app, predictionEngine);
    mapAction(app, predictionEngine);
    playerAction(app, predictionEngine);
    questAction(app, predictionEngine);
    storyAction(app, predictionEngine);
    timeAction(app, predictionEngine);
 }