// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Application, AuthError } from '@microsoft/teams-ai';
import { TurnContext } from 'botbuilder';
import { ApplicationTurnState } from './bot';

/**
 * Configure authentication with GitHub for the login and logout flows.
 * @param {Application<ApplicationTurnState>} app The application
 */
export function configureUserAuthentication(app: Application<ApplicationTurnState>) {
    app.message('logout', async (context: TurnContext, state: ApplicationTurnState) => {
        await app.authentication.signOutUser(context, state);
        await context.sendActivity(`You have been signed out`);
    });

    app.authentication.get('github').onUserSignInSuccess(async (context: TurnContext, state: ApplicationTurnState) => {
        await context.sendActivity('Successfully logged in to GitHub');
        await context.sendActivity(`Token string length: ${state.temp.authTokens['github']!.length}`);
        await context.sendActivity(`This is what you said before the AuthFlow started: ${context.activity.text}`);
    });

    app.authentication
        .get('github')
        .onUserSignInFailure(async (context: TurnContext, _state: ApplicationTurnState, error: AuthError) => {
            await context.sendActivity('Failed to login to GitHub');
            await context.sendActivity(`Error message: ${error.message}`);
        });
}
