/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Activity } from '@microsoft/teams-core';

/**
 * A class with dialog arguments for a SkillDialog.
 */
export interface BeginSkillDialogOptions {
    /**
     * The Activity to send to the skill.
     */
    activity: Partial<Activity>;
}
