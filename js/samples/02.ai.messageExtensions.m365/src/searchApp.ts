import { default as axios } from "axios";
import {
  TeamsActivityHandler,
  CardFactory,
  TurnContext,
  MessagingExtensionQuery,
  MessagingExtensionResponse,
  MessagingExtensionAttachment,
  TaskModuleRequest,
  TaskModuleResponse,
} from "botbuilder";
import { AdaptiveCardFactory } from "./adaptiveCardFactory";
import { Deliverables } from "./data";


export class SearchApp extends TeamsActivityHandler {
  // if the user has reviewed the document
  private hasBeenReviewed = false;
  private adaptiveCardFactory = new AdaptiveCardFactory();

  constructor() {
    super();
  }


  // http request to get an image as a blob
  // This might need to have an auth token added to the header
  private async getImageBlob(url:string): Promise<any> {
    return await axios.get(url, {
      responseType: 'arraybuffer'
    });
  }
  
  // convert image blob to base64
  private async getImageAsBase64(imageData: any) {
      return Buffer.from(imageData, 'binary').toString('base64');
  }

  // Search.
  public async handleTeamsMessagingExtensionQuery(
    context: TurnContext,
    query: MessagingExtensionQuery
  ): Promise<MessagingExtensionResponse> {
    if (query.parameters === undefined || query.parameters.length === 0) {
      return {
        composeExtension: {
          type: "message",
          text: "Please enter a search query",
        },
      };
    }

    let attachments: MessagingExtensionAttachment[] = [];
    try {

      const searchQuery = query.parameters[0].value;
      console.log("query: " + searchQuery);

      const attachmentsPromise: Promise<MessagingExtensionAttachment>[] = Deliverables.map(async (deliverable) => {
        // fetch the image and update the thumbnail property before binding it to the card
        const adaptiveCard = this.adaptiveCardFactory.getDeliverableAdaptiveCard(deliverable);

        // Create a preview card
        const preview = CardFactory.heroCard(deliverable.entity);

        // Return the full attachment
        return { ...adaptiveCard, preview };
      });

      attachments = await Promise.all(attachmentsPromise);
      // log how many items are returned
      console.log("Attachment Length: " + attachments.length);

    } catch (error) {
      console.log(error);
    }

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }


  /**
	 * Handle when user opens the task module
	 * @param context Teams TurnContext data
	 * @param action Teams TaskModuleRequest data
	 * @returns Teams TaskModuleResponse to open an adaptive card or html page in a popup
	 */
  public async handleTeamsTaskModuleFetch(
    context: TurnContext, 
    action: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
    console.log("fetch task");
    console.log(JSON.stringify(action));


    switch (action.data.command) {
      case "approve_reject": {
        // if the document has been reviewed, show the approve/reject card
        const taskModuleResponse: TaskModuleResponse = {
          task: {
            type: 'continue',
            value: {
              title: 'Approve/Reject',
              height: 300,
              width: 400,
              card: this.adaptiveCardFactory.getApproveRejectAdaptiveCard(action.data),
            },
          }
        };
        return taskModuleResponse;
      }
      case "view_document": {
        // show the document in a popup and set that it has been reviewed
        // TODO this hasBeenReviewed bool is for demo purposes only
        // It should be replaced with a call to Sightline to update that the
        // user has reviewed the document
        this.hasBeenReviewed = true;
        const deliverable = Deliverables.find((deliverable) => deliverable.id == action.data.id);
        const documentUrl = deliverable ? deliverable.url : '';
        const taskModuleResponse: TaskModuleResponse = {
          task: {
            type: 'continue',
            value: {
              title: 'Approve/Reject',
              height: 300,
              width: 400,
              card: this.adaptiveCardFactory.getReviewDocumentAdaptiveCard(action.data),
            },
          }
        };
        return taskModuleResponse;
      }
      default:
        break;
    }

    return {
      task: {
        type: 'continue',
      },
    };
  }

  // Handle when user submits the task module
  public async handleTeamsTaskModuleSubmit(
    context: TurnContext, 
    action: TaskModuleRequest
    ): Promise<TaskModuleResponse> {
      console.log("submit task");
      console.log(JSON.stringify(action));

      if (action.data.command == "view_document") {
        this.hasBeenReviewed = true;
        return {
          task: {
            type: 'continue',
            value: {
              title: 'Expense Approval',
              height: 1000,
              width: 1000,
              card: this.adaptiveCardFactory.getExpenseReportAdaptiveCard(),
            },
          },
        }
      } else {
        let message = "";
        if (action.data.command == "approve") {
          message = "Deliverable has been approved."
        }
        if (action.data.command == "reject") {
          message = "Deliverable has been rejected."
        }

      return {
        task: {
          type: 'message',
          value: message
        },
      }
    }
  }

}
