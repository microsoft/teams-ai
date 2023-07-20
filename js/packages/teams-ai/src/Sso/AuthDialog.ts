import { ComponentDialog, OAuthPrompt, WaterfallDialog } from "botbuilder-dialogs";
import { SsoPrompt } from "./SsoPrompt";

export class AuthDialog extends ComponentDialog {
  constructor(dialogId: string, prompt: OAuthPrompt | SsoPrompt) {
    super(dialogId);

    this.addDialog(prompt);
    this.addDialog(new WaterfallDialog(dialogId, [
      async (step) => {
        await step.context.sendActivity(`begin prompt.`);
        return await step.beginDialog(prompt.id);
      },
      async (step) => {
        const token = step.result;
        if (token) {
          await step.context.sendActivity(`You are now logged in.`);
          await step.context.sendActivity(token);
          return await step.endDialog();
        } else {
          await step.context.sendActivity(`Sorry... We couldn't log you in. Try again later.`);
          return await step.endDialog();
        }
      }
    ]));
  }
}