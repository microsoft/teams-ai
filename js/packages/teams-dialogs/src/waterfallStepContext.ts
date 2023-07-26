/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { DialogReason, DialogTurnResult } from './dialog';
import { DialogContext } from './dialogContext';

/**
 * Values passed to the `WaterfallStepContext` constructor.
 */
export interface WaterfallStepInfo<O extends object> {
    /**
     * The index of the current waterfall step being executed.
     */
    index: number;

    /**
     * Any options passed to the steps waterfall dialog when it was started with
     * `DialogContext.beginDialog()`.
     */
    options: O;

    /**
     * The reason the waterfall step is being executed.
     */
    reason: DialogReason;

    /**
     * Results returned by a dialog or prompt that was called in the previous waterfall step.
     */
    result: any;

    /**
     * A dictionary of values which will be persisted across all waterfall steps.
     */
    values: object;

    /**
     * Called to skip to the next waterfall step.
     *
     * @param result (Optional) result to pass to the next step.
     */
    onNext(result?: any): Promise<DialogTurnResult>;
}

/**
 * Context object passed in to a `WaterfallStep`.
 *
 * @param O (Optional) type of options passed to the steps waterfall dialog in the call to `DialogContext.beginDialog()`.
 */
export class WaterfallStepContext<O extends object = {}> extends DialogContext {
    private _info: WaterfallStepInfo<O>;

    /**
     * Creates a new WaterfallStepContext instance.
     *
     * @param dc The dialog context for the current turn of conversation.
     * @param info Values to initialize the step context with.
     */
    constructor(dc: DialogContext, info: WaterfallStepInfo<O>) {
        super(dc.dialogs, dc, { dialogStack: dc.stack });
        this._info = info;
        this.parent = dc.parent;
    }

    /**
     * The index of the current waterfall step being executed.
     *
     * @returns The index of the current waterfall step being executed.
     */
    get index(): number {
        return this._info.index;
    }

    /**
     * Any options passed to the steps waterfall dialog when it was started with
     * `DialogContext.beginDialog()`.
     *
     * @returns Any options the waterfall dialog was called with.
     */
    get options(): O {
        return this._info.options;
    }

    /**
     * The reason the waterfall step is being executed.
     *
     * @returns The reason the waterfall step is being executed.
     */
    get reason(): DialogReason {
        return this._info.reason;
    }

    /**
     * Results returned by a dialog or prompt that was called in the previous waterfall step.
     *
     * @returns The result from the previous waterfall step.
     */
    get result(): any {
        return this._info.result;
    }

    /**
     * A dictionary of values which will be persisted across all waterfall steps.
     *
     * @returns A dictionary of values which will be persisted across all waterfall steps.
     */
    get values(): object {
        return this._info.values;
    }

    /**
     * Skips to the next waterfall step.
     *
     * @remarks
     *
     * ```JavaScript
     * return await step.skip();
     * ```
     * @param result (Optional) result to pass to the next step.
     * @returns A promise with the DialogTurnResult.
     */
    async next(result?: any): Promise<DialogTurnResult> {
        return await this._info.onNext(result);
    }
}
