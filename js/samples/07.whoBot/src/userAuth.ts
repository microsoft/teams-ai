import { Application, AuthError } from '@microsoft/teams-ai';
import { TurnContext } from 'botbuilder';
import { ApplicationTurnState } from './bot';

/**
 * Configure user authentication
 * @param {Application<ApplicationTurnState>} app The application
 */
export function configureUserAuthentication(app: Application<ApplicationTurnState>) {
    // Register signout handler
    app.message('/signout', async (context: TurnContext, state: ApplicationTurnState) => {
        await app.authentication.signOutUser(context, state);

        // Echo back users request
        await context.sendActivity(`You have signed out`);
    });

    // Register success sign in handler
    app.authentication.get('graph').onUserSignInSuccess(async (context: TurnContext) => {
        await context.sendActivity('Thanks for logging in, you are now authenticated.');
        await context.sendActivity(`I can now fulfil your request.`);
    });

    // Register failure sign in handler
    app.authentication
        .get('graph')
        .onUserSignInFailure(async (context: TurnContext, _state: ApplicationTurnState, error: AuthError) => {
            // Failed to login
            await context.sendActivity('Failed to login');
            await context.sendActivity(`Error message: ${error.message}`);
        });
}
