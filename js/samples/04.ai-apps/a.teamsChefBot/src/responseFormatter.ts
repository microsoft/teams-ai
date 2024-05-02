import { Application, AI, PredictedSayCommand } from '@microsoft/teams-ai';

/**
 *
 * @param {Application} app Application to add the response formatter to.
 */
export function addResponseFormatter(app: Application): void {
    app.ai.action<PredictedSayCommand>(AI.SayCommandActionName, async (context, state, data) => {
        // Replace markdown code blocks with <pre> tags
        let addTag = false;
        let inCodeBlock = false;
        const output: string[] = [];
        const response = data.response.content!.split('\n');
        for (const line of response) {
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    // Add tag to start of next line
                    addTag = true;
                    inCodeBlock = true;
                } else {
                    // Add tag to end of previous line
                    output[output.length - 1] += '</pre>';
                    addTag = false;
                    inCodeBlock = false;
                }
            } else if (addTag) {
                output.push(`<pre>${line}`);
                addTag = false;
            } else {
                output.push(line);
            }
        }

        // Send response
        const formattedResponse = output.join('\n');
        await context.sendActivity(formattedResponse);

        return '';
    });
}
