import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState } from "../bot";
import { buyItemAction } from "./buyItemAction";
import { changeLocationAction } from "./changeLocationAction";
import { changePlayerNameAction } from "./changePlayerNameAction";
import { consumeItemAction } from "./consumeItemAction";
import { craftItemAction } from "./craftItemAction";
import { dropItemAction } from "./dropItemAction";
import { foundItemAction } from "./foundItemAction";
import { ignoredActions } from "./ignoredActions";
import { listDroppedAction } from "./listDroppedAction";
import { listInventoryAction } from "./listInventoryAction";
import { passTimeAction } from "./passTimeAction";
import { pickupItemAction } from "./pickupItemAction";
import { sellItemAction } from "./sellItemAction";
import { updatePlayerBackstoryAction } from "./updatePlayerBackstoryAction";
import { updateStoryAction } from "./updateStoryAction";
import { useMapAction } from "./useMapAction";

export function addActions(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    buyItemAction(app, predictionEngine);
    changeLocationAction(app, predictionEngine);
    changePlayerNameAction(app, predictionEngine);
    consumeItemAction(app, predictionEngine);
    craftItemAction(app, predictionEngine);
    dropItemAction(app, predictionEngine);
    foundItemAction(app, predictionEngine);
    ignoredActions(app, predictionEngine);
    listDroppedAction(app, predictionEngine);
    listInventoryAction(app, predictionEngine);
    passTimeAction(app, predictionEngine);
    pickupItemAction(app, predictionEngine);
    sellItemAction(app, predictionEngine);
    updatePlayerBackstoryAction(app, predictionEngine);
    updateStoryAction(app, predictionEngine);
    useMapAction(app, predictionEngine);
}