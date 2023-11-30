import { Application, Query, TurnState } from '@microsoft/teams-ai';
// import { Application, Query, TurnState } from './microsoft/teams-ai';
import {
    CardFactory,
    MemoryStorage,
    MessagingExtensionAttachment,
    TaskModuleTaskInfo,
    TurnContext
} from 'botbuilder';
import { AdaptiveCardFactoryAI } from './adaptiveCardFactory.ai';
import { Deliverables } from './data';

export type TData = Record<string, any | any[]>;

export class SearchAppAI extends Application<TurnState> {
    public static readonly MessageExtensionCommand = 'searchQuery';
    private hasBeenReviewed = false;
    private adaptiveCardFactory = new AdaptiveCardFactoryAI();

    constructor(storage: MemoryStorage) {
        super({ storage });

        /**
         * Handles the query command for the message extension.
         * Retrieves search results based on the provided query parameters.
         * @param context The turn context.
         * @param state The turn state.
         * @param query The query parameters.
         * @returns The search results as a list of attachments.
         */
        this.messageExtensions.query(
            SearchAppAI.MessageExtensionCommand,
            async (context: TurnContext, state: TurnState, query: Query<Record<string, any>>) => {
                const searchQuery = query.parameters.searchQuery ?? '';
                console.log('query: ' + searchQuery);
                try {
                    const attachmentsPromise: Promise<MessagingExtensionAttachment>[] = Deliverables.map(
                        async (deliverable) => {
                            // Create a copy of the object so we don't modify the original
                            const deliverableCopy = Object.assign({}, deliverable);
                            deliverableCopy.entity = `${deliverable.entity} for ${searchQuery}`;
                            // fetch the image and update the thumbnail property before binding it to the card
                            const adaptiveCard = this.adaptiveCardFactory.getDeliverableAdaptiveCard(deliverableCopy);

                            // Create a preview card
                            const preview = CardFactory.heroCard(deliverableCopy.entity);

                            // Return the full attachment
                            return { ...adaptiveCard, preview };
                        }
                    );

                    const attachments = await Promise.all(attachmentsPromise);
                    // log how many items are returned
                    console.log('Attachment Length: ' + attachments.length);

                    // Return results as a list
                    return {
                        type: 'result',
                        attachmentLayout: 'list',
                        attachments: attachments
                    };
                } catch (error: any) {
                    console.log(error);
                    return {
                        type: 'message',
                        text: error.message
                    };
                }
            }
        );

        /**
         * Handles the selectItem command for the message extension.
         * This is sent when the user selects an item from the search results.
         * @param context The turn context.
         * @param state The turn state.
         * @param data The selected item data.
         */
        // this.messageExtensions.handleOnButtonClicked(
        //     async (context: TurnContext, state: TurnState, data: TData) => {
        //         console.log(`data: ${JSON.stringify(data, null, 2)}`);
        //         console.log(`Activity Type: ${JSON.stringify(context.activity.type, null, 2)}`);
        //         console.log(`Activity Name: ${JSON.stringify(context.activity.name, null, 2)}`);
        //         console.log(`Activity Value: ${JSON.stringify(context.activity.value, null, 2)}`);

        //         if (data.command === 'approve_reject') {
        //             const card = this.adaptiveCardFactory.getApproveRejectAdaptiveCard(context.activity.value);
        //             await context.sendActivity({
        //                 value: { status: 200 } as InvokeResponse,
        //                 type: ActivityTypes.InvokeResponse
        //             });
        //         } else if (data.command === 'view_document') {
        //             const card = this.adaptiveCardFactory.getReviewDocumentAdaptiveCard(context.activity.value);
        //             await context.sendActivity({
        //                 attachments: [card],
        //                 id: context.activity.replyToId,
        //                 type: 'message'
        //             });
        //         }
        //     }
        // );

        /**
         * Handles the fetch command for the task module.
         * Retrieves the approve/reject card for the selected item.
         * @param context The turn context.
         * @param state The turn state.
         * @param data The selected item data.
         * @returns The task module response containing the approve/reject card.
         */
        this.taskModules.fetch('approve/reject', async (context: TurnContext, state: TurnState, data: TData) => {
            console.log(`data: ${JSON.stringify(data, null, 2)}`);
            console.log(`Activity Type: ${JSON.stringify(context.activity.type, null, 2)}`);
            console.log(`Activity Name: ${JSON.stringify(context.activity.name, null, 2)}`);
            console.log(`Activity Value: ${JSON.stringify(context.activity.value, null, 2)}`);
            // if the document has been reviewed, show the approve/reject card
            const taskModuleResponse: TaskModuleTaskInfo = {
                title: 'Approve/Reject',
                height: 300,
                width: 400,
                card: this.adaptiveCardFactory.getApproveRejectAdaptiveCard(data),
            };
            return taskModuleResponse;
        });

        /**
         * Handles the fetch command for the task module.
         * Retrieves the review document card for the selected item.
         * @param context The turn context.
         * @param state The turn state.
         * @param data The selected item data.
         * @returns The task module response containing the review document card.
         */
        this.taskModules.fetch('reviewDocument', async (context: TurnContext, state: TurnState, data: TData) => {
            console.log(`data: ${JSON.stringify(data, null, 2)}`);
            console.log(`Activity Type: ${JSON.stringify(context.activity.type, null, 2)}`);
            console.log(`Activity Name: ${JSON.stringify(context.activity.name, null, 2)}`);
            console.log(`Activity Value: ${JSON.stringify(context.activity.value, null, 2)}`);
            // show the document in a popup and set that it has been reviewed
            // TODO this hasBeenReviewed bool is for demo purposes only
            // It should be replaced with a call to Sightline to update that the
            // user has reviewed the document
            this.hasBeenReviewed = true;
            const deliverable = Deliverables.find((deliverable) => deliverable.id === data.id);
            const documentUrl = deliverable ? deliverable.url : '';

            const result: TaskModuleTaskInfo = {
                title: 'Expense Approval',
                height: 1000,
                width: 1000,
                card: this.adaptiveCardFactory.getExpenseReportAdaptiveCard(),
            };
            return result;
        });

        /**
         * Handles the submit command for the task module.
         * Retrieves the approve/reject card for the selected item.
         * @param context The turn context.
         * @param state The turn state.
         * @param data The selected item data.
         * @returns The task module response containing the approve/reject card.
         */
        this.taskModules.submit('approve/reject', async (context: TurnContext, state: TurnState, data: TData) => {
            console.log(`data: ${JSON.stringify(data, null, 2)}`);
            console.log(`Activity Type: ${JSON.stringify(context.activity.type, null, 2)}`);
            console.log(`Activity Name: ${JSON.stringify(context.activity.name, null, 2)}`);
            console.log(`Activity Value: ${JSON.stringify(context.activity.value, null, 2)}`);

            const result: TaskModuleTaskInfo = {
                title: data.command === "approve" ? 'Deliverable has been approved.' : 'Deliverable has been rejected.',
                height: 1000,
                width: 1000,
            };

            return data.command === "approve" ? 'Deliverable has been approved.' : 'Deliverable has been rejected.';
        });

        /**
         * Handles the submit command for the task module.
         * Retrieves the approve card for the selected item.
         * @param context The turn context.
         * @param state The turn state.
         * @param data The selected item data.
         * @returns The task module response containing the approve card.
         */
        this.taskModules.submit('approve', async (context: TurnContext, state: TurnState, data: TData) => {
            console.log(`data: ${JSON.stringify(data, null, 2)}`);
            console.log(`Activity Type: ${JSON.stringify(context.activity.type, null, 2)}`);
            console.log(`Activity Name: ${JSON.stringify(context.activity.name, null, 2)}`);
            console.log(`Activity Value: ${JSON.stringify(context.activity.value, null, 2)}`);

            return "Expense has been approved.";
        });

        /**
         * Handles the submit command for the task module.
         * Retrieves the reject card for the selected item.
         * @param context The turn context.
         * @param state The turn state.
         * @param data The selected item data.
         * @returns The task module response containing the reject card.
         */
        this.taskModules.submit('reject', async (context: TurnContext, state: TurnState, data: TData) => {
            console.log(`data: ${JSON.stringify(data, null, 2)}`);
            console.log(`Activity Type: ${JSON.stringify(context.activity.type, null, 2)}`);
            console.log(`Activity Name: ${JSON.stringify(context.activity.name, null, 2)}`);
            console.log(`Activity Value: ${JSON.stringify(context.activity.value, null, 2)}`);

            return "Expense has been rejected.";
        });
    }
}
