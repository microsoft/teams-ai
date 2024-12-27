/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SensitivityUsageInfo } from './SensitivityUsageInfo';

export type ClientCitationIconName =
    | 'Microsoft Word'
    | 'Microsoft Excel'
    | 'Microsoft PowerPoint'
    | 'Microsoft OneNote'
    | 'Microsoft SharePoint'
    | 'Microsoft Visio'
    | 'Microsoft Loop'
    | 'Microsoft Whiteboard'
    | 'Adobe Illustrator'
    | 'Adobe Photoshop'
    | 'Adobe InDesign'
    | 'Adobe Flash'
    | 'Sketch'
    | 'Source Code'
    | 'Image'
    | 'GIF'
    | 'Video'
    | 'Sound'
    | 'ZIP'
    | 'Text'
    | 'PDF';

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
    position: number;
    appearance: {
        /**
         * Required; Must be 'DigitalDocument'
         */
        '@type': 'DigitalDocument';

        /**
         * Name of the document. (max length 80)
         */
        name: string;

        /**
         * Stringified adaptive card with additional information about the citation.
         * It is rendered within the modal.
         */
        text?: string;

        /**
         * URL of the document. This will make the name of the citation clickable and direct the user to the specified URL.
         */
        url?: string;

        /**
         * Extract of the referenced content. (max length 160)
         */
        abstract: string;

        /**
         * Encoding format of the `citation.appearance.text` field.
         */
        encodingFormat?: 'application/vnd.microsoft.card.adaptive';

        /**
         * Information about the citation’s icon.
         */
        image?: {
            '@type': 'ImageObject';

            /**
             * The image/icon name
             */
            name: ClientCitationIconName;
        };

        /**
         * Optional; set by developer. (max length 3) (max keyword length 28)
         */
        keywords?: string[];

        /**
         * Optional sensitivity content information.
         */
        usageInfo?: SensitivityUsageInfo;
    };
}
