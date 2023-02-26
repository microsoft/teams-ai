import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState } from "../bot";
import { buyItemAction } from "./buyItemAction";
import { changeLocationAction } from "./changeLocationAction";
import { changePlayerNameAction } from "./changePlayerNameAction";
import { dropItemAction } from "./dropItemAction";
import { foundItemAction } from "./foundItemAction";
import { listDroppedAction } from "./listDroppedAction";
import { listInventoryAction } from "./listInventoryAction";
import { pickupItemAction } from "./pickupItemAction";
import { sellItemAction } from "./sellItemAction";
import { startQuestAction } from "./startQuestAction";
import { useMapAction } from "./useMapAction";

export function addActions(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    buyItemAction(app, predictionEngine);
    changeLocationAction(app, predictionEngine);
    changePlayerNameAction(app, predictionEngine);
    dropItemAction(app, predictionEngine);
    foundItemAction(app, predictionEngine);
    listDroppedAction(app, predictionEngine);
    listInventoryAction(app, predictionEngine);
    pickupItemAction(app, predictionEngine);
    sellItemAction(app, predictionEngine);
    startQuestAction(app, predictionEngine);
    useMapAction(app, predictionEngine);
}