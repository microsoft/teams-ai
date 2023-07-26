/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Represents the events related to the "lifecycle" of the dialog.
 */
export class DialogEvents {
    /**
     * Event fired by a dialog to indicate that its `beginDialog()` method has been called.
     */
    static readonly beginDialog = 'beginDialog';

    /**
     * Event fired when `DialogContext.repromptDialog()` is called.
     */
    static readonly repromptDialog = 'repromptDialog';

    /**
     * Event fired when a dialog is being canceled.
     */
    static readonly cancelDialog = 'cancelDialog';

    /**
     * Event fired when an activity is received from the adapter (or a request to reprocess an activity.)
     */
    static readonly activityReceived = 'activityReceived';

    /**
     * Event fired when the system has detected that deployed code has changed the execution of dialogs between turns.
     */
    static readonly versionChanged = 'versionChanged';

    /**
     * Event fired when there was an exception thrown in the system.
     */
    static readonly error = 'error';
}
