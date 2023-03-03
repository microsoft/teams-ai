import { Application, OpenAIPredictionEngine } from "botbuilder-m365";
import { ApplicationTurnState } from "../bot";

export function ignoredActions(app: Application<ApplicationTurnState>, predictionEngine: OpenAIPredictionEngine): void {
    app.ai.action(['attack', 'equipItem', 'negotiate', 'setCamp'], async (context, state) => {
        // No action
        return true;
    });
}