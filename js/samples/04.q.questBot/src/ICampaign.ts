// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { JSONResponseValidator } from "@microsoft/teams-ai";
import { Schema } from "jsonschema";

export interface ICampaign {
    title: string;
    playerIntro: string;
    objectives: ICampaignObjective[];
}

export interface ICampaignObjective {
    title: string;
    description: string;
    completed: boolean;
}

const campaignSchema: Schema = {
    type: "object",
    properties: {
        title: { type: "string" },
        playerIntro: { type: "string" },
        objectives: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    completed: { type: "boolean" },
                },
                required: ["title", "description", "completed"],
            },
        },
    },
    required: ["title", "playerIntro", "objectives"]
}

export const campaignValidator = new JSONResponseValidator<ICampaign>(campaignSchema);