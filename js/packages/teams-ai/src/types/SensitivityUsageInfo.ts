/**
 * Sensitivity usage info for content sent to the user. This is used to provide information about the content to the user. See ClientCitation for more information.
 */
export interface SensitivityUsageInfo {
    /**
     * Must be "https://schema.org/Message"
     */
    type: 'https://schema.org/Message';

    /**
     * Required; Set to CreativeWork;
     */
    '@type': 'CreativeWork';

    /**
     * Sensitivity description of the content
     */
    description?: string;

    /**
     * Sensitivity title of the content
     */
    name: string;

    /**
     * Optional; ignored in Teams.
     */
    position?: number;

    pattern?: {
        /**
         * Set to DefinedTerm
         */
        '@type': 'DefinedTerm';

        inDefinedTermSet: string;

        /**
         * Color
         */
        name: string;

        /**
         * e.g. #454545
         */
        termCode: string;
    };
}
