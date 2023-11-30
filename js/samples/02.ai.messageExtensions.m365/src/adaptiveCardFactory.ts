import * as ACData from "adaptivecards-templating";
import { Attachment, CardFactory } from "botbuilder";
import expenseReportCard from "./adaptiveCards/expenseReport.json";
import expenseReportData from "./adaptiveCards/expenseReportData.json";

export class AdaptiveCardFactory {

  // get an adaptive card with data bound to it
  private getAdaptiveCardWithData(template: ACData.Template, data: any): Attachment {
    // Bind the data to the template
    const cardWithData = template.expand({
      $root: {
        ...data
      }
    });

    // Convert the card to an adaptive card attachment
    return CardFactory.adaptiveCard(cardWithData);
  }

  private getDeliverablesAdaptiveCardTemplate(): ACData.Template {
    // Deliverable adaptive card template
    const deliverableCardTemplate = new ACData.Template({
      type: "AdaptiveCard",
      body: [
          {
              type: "TextBlock",
              text: "${entity}",
              wrap: true,
              style: "heading"
          },
          {
              type: "ColumnSet",
              columns: [
                  {
                      type: "Column",
                      width: "auto",
                      items: [
                          {
                              type: "Image",
                              url: "${thumbnail}", 
                              altText: "${deliverableName}",
                              size: "Small"
                          }
                      ]
                  },
                  {
                      type: "Column",
                      width: "stretch",
                      separator: true,
                      items: [
                          {
                              type: "TextBlock",
                              text: "${deliverableName}",
                              wrap: true,
                              style: "default",
                              size: "Medium"
                          }
                      ]
                  }
              ]
          },
          {
              type: "FactSet",
              facts: [
                  {
                      $data: "${properties}",
                      title: "${key}:",
                      value: "${value}"
                  }
              ]
          }
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'AI Approve/Reject',
          data:
            {
              verb: 'approve/reject',
              msteams: {
                  type: 'task/fetch'
              }, 
              command: 'approve_reject',
              id: '${id}'
            }
        },
        {
          type: "Action.Submit",
          title: "Review AI Document",
          data:
            {
              verb: 'reviewDocument',
              msteams: {
                  type: 'task/fetch'
              },
              command: 'view_document',
              id: '${id}'
            }
        }, 
      ],
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.6"
    });

    return deliverableCardTemplate;
  }

  private getReviewDocumentCardTemplate(): ACData.Template {
    // Review document adaptive card
    const reviewDocumentCard = new ACData.Template({
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Please review the document before approving or rejecting the deliverable.",
          wrap: true,
          size: "medium",
        },
      ],
      actions: [
        {
          type: "Action.Submit",
          title: "Review Document",
          data:
            {
              msteams: {
                  type: 'task/fetch'
              }, 
              command: 'reviewDocument',
              id: '${id}',
              verb: 'reviewDocument'
            }
        }
      ],
    });
    return reviewDocumentCard;
  }

  private getApproveRejectCardTemplate(): ACData.Template {
    // Approve/Reject adaptive card
    const approveRejectCard = new ACData.Template({
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Please approve or reject the deliverable.",
          wrap: true,
          size: "medium",
        },
      ],
      actions: [
        {
          type: 'Action.Submit',
          title: 'Approve',
          data: {
              command: 'approve',
              id: '${id}',
              verb: 'approve/reject'
          }
        },
        {
          type: "Action.ShowCard",
          title: "Reject",
          card: {
              type: "AdaptiveCard",
              body: [
                  {
                      type: "Input.Text",
                      id: "comment",
                      isMultiline: true,
                      label: "Add a comment"
                  }
              ],
              actions: [
                  {
                      type: "Action.Submit",
                      title: "Reject",
                      data: {
                        command: "reject",
                        id: '${id}',
                        verb: 'approve/reject'
                      }
                  }
              ],
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json"
          }
        },
      ],
    });

    return approveRejectCard;
  }


  public getDeliverableAdaptiveCard(data: any): Attachment {
    const deliverableCardTemplate = this.getDeliverablesAdaptiveCardTemplate();
    return this.getAdaptiveCardWithData(deliverableCardTemplate, data);
  }

  public getReviewDocumentAdaptiveCard(data: any): Attachment {
    const reviewDocumentCard = this.getReviewDocumentCardTemplate();
    return this.getAdaptiveCardWithData(reviewDocumentCard, data);
  }

  public getApproveRejectAdaptiveCard(data: any): Attachment {
    const approveRejectCard = this.getApproveRejectCardTemplate();
    return this.getAdaptiveCardWithData(approveRejectCard, data);
  }

  public getExpenseReportAdaptiveCard(): Attachment {
    // Approve/Reject adaptive card
    const card = new ACData.Template(expenseReportCard);  

    return this.getAdaptiveCardWithData(card, expenseReportData);
  }  
}