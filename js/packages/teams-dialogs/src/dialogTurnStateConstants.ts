/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Defines dialog turn state constants.
 */
export class DialogTurnStateConstants {
    static configuration = Symbol('configuration');
    static dialogManager = Symbol('dialogManager');
    static telemetryClient = Symbol('telemetryClient');
    static queueStorage = Symbol('queueStorage');
}
