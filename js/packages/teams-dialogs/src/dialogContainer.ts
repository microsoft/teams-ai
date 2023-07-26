/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BotTelemetryClient, NullTelemetryClient, Severity } from '@microsoft/teams-core';
import { Dialog, DialogEvent } from './dialog';
import { DialogSet } from './dialogSet';
import { DialogContext } from './dialogContext';
import { DialogEvents } from './dialogEvents';

/**
 * A container for a set of Dialogs.
 */
export abstract class DialogContainer<O extends object = {}> extends Dialog<O> {
    /**
     * The containers dialog set.
     */
    readonly dialogs = new DialogSet(undefined);

    /**
     * Creates an inner dialog context for the containers active child.
     *
     * @param dc Parents dialog context.
     * @returns A new dialog context for the active child or `undefined` if there is no active child.
     */
    abstract createChildContext(dc: DialogContext): DialogContext | undefined;

    /**
     * Finds a child dialog that was previously added to the container.
     *
     * @param dialogId ID of the dialog to lookup.
     * @returns The Dialog if found; otherwise null.
     */
    findDialog(dialogId: string): Dialog | undefined {
        return this.dialogs.find(dialogId);
    }

    /**
     * Called when an event has been raised, using `DialogContext.emitEvent()`,
     * by either the current dialog or a dialog that the current dialog started.
     *
     * @param dc The dialog context for the current turn of conversation.
     * @param e The event being raised.
     * @returns True if the event is handled by the current dialog and bubbling should stop.
     */
    async onDialogEvent(dc: DialogContext, e: DialogEvent): Promise<boolean> {
        const handled = await super.onDialogEvent(dc, e);
        if (!handled && e.name === DialogEvents.versionChanged) {
            const traceMessage = `Unhandled dialog event: ${e.name}. Active Dialog: ${dc.activeDialog!.id}`;
            dc.dialogs.telemetryClient?.trackTrace({
                message: traceMessage,
                severityLevel: Severity.Warning,
            });
            await dc.context.sendTraceActivity(traceMessage);
        }
        return handled;
    }

    /**
     * Returns internal version identifier for this container.
     *
     * @remarks
     * DialogContainers detect changes of all sub-components in the container and map that to a `versionChanged` event.
     * Because they do this, DialogContainers "hide" the internal changes and just have the .id. This isolates changes
     * to the container level unless a container doesn't handle it.  To support this DialogContainers define a
     * protected method getInternalVersion() which computes if this dialog or child dialogs have changed
     * which is then examined via calls to checkForVersionChange().
     * @returns Version which represents the change of the internals of this container.
     */
    protected getInternalVersion(): string {
        return this.dialogs.getVersion();
    }

    /**
     * Checks to see if a containers child dialogs have changed since the current dialog instance
     * was started.
     *
     * @remarks
     * This should be called at the start of `beginDialog()`, `continueDialog()`, and `resumeDialog()`.
     * @param dc Current dialog context.
     */
    protected async checkForVersionChange(dc: DialogContext): Promise<void> {
        const current = dc.activeDialog!.version;
        dc.activeDialog!.version = this.getInternalVersion();

        // Check for change of previously stored hash
        if (current && current != dc.activeDialog!.version) {
            // Give bot an opportunity to handle the change.
            // - If bot handles it the changeHash will have been updated as to avoid triggering the
            //   change again.
            await dc.emitEvent(DialogEvents.versionChanged, this.id, true, false);
        }
    }

    /**
     * Set the telemetry client, and also apply it to all child dialogs.
     * Future dialogs added to the component will also inherit this client.
     */
    set telemetryClient(client: BotTelemetryClient) {
        this._telemetryClient = client ?? new NullTelemetryClient();
        if (this.dialogs.telemetryClient !== this._telemetryClient) {
            this.dialogs.telemetryClient = this._telemetryClient;
        }
    }

    /**
     * Get the current telemetry client.
     *
     * @returns The [BotTelemetryClient](xref:botbuilder.BotTelemetryClient) to use for logging.
     */
    get telemetryClient(): BotTelemetryClient {
        return this._telemetryClient;
    }
}
