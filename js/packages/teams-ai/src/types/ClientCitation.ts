/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SensitivityUsageInfo } from './SensitivityUsageInfo';

/**
 * Represents a Teams client citation to be included in a message. See Bot messages with AI-generated content for more details.
 * https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bot-messages-ai-generated-content?tabs=before%2Cbotmessage
 */
export interface ClientCitation {
    /**
     * Required; must be "Claim"
     */
    '@type': 'Claim';

    /**
     * Required. Number and position of the citation.
     */
    position: string;
    appearance: {
        /**
         * Required; Must be 'DigitalDocument'
         */
        '@type': 'DigitalDocument';

        /**
         * Name of the document.
         */
        name: string;

        /**
         * Optional; ignored in Teams
         */
        text?: string;

        /**
         * URL of the document. This will make the name of the citation clickable and direct the user to the specified URL.
         */
        url?: string;

        /**
         * Content of the citation. Must be clipped if longer than 480 characters.
         */
        abstract: string;

        /**
         * Used for icon; for now it is ignored.
         */
        encodingFormat?: 'text/html';

        /**
         * For now ignored, later used for icon
         */
        image?: string;

        /**
         * Optional; set by developer
         */
        keywords?: string[];

        /**
         * Optional sensitivity content information.
         */
        usageInfo?: SensitivityUsageInfo;
    };
}
