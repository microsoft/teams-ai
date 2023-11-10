/* eslint-disable security/detect-object-injection */
import {
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
    OAuthPrompt,
    OAuthPromptSettings
} from 'botbuilder-dialogs';
import { TurnState } from '../TurnState';
import { Application } from '../Application';
import {
    ActivityTypes,
    MemoryStorage,
    TeamsSSOTokenExchangeMiddleware,
    TurnContext,
    Storage,
    verifyStateOperationName,
    tokenExchangeOperationName,
    TokenResponse
} from 'botbuilder';
import { TurnStateProperty } from '../TurnStateProperty';
import { AuthError } from './Authentication';

/**
 * @internal
 */
interface UserAuthState {
    message?: string;
}

/**
 * @internal
 */
export class BotAuthentication<TState extends TurnState> {
    private _oauthPrompt: OAuthPrompt;
    private _storage: Storage;
    private _userSignInSuccessHandler?: (context: TurnContext, state: TState) => Promise<void>;
    private _userSignInFailureHandler?: (context: TurnContext, state: TState, error: AuthError) => Promise<void>;
    private _settingName: string;

    public constructor(
        app: Application<TState>,
        oauthPromptSettings: OAuthPromptSettings,
        settingName: string,
        storage?: Storage
    ) {
        // Create OAuthPrompt
        this._oauthPrompt = new OAuthPrompt('OAuthPrompt', oauthPromptSettings);
        this._settingName = settingName;

        this._storage = storage || new MemoryStorage();

        // Handles deduplication of token exchange event when using SSO with Bot Authentication
        app.adapter.use(new FilteredTeamsSSOTokenExchangeMiddleware(this._storage, oauthPromptSettings.connectionName));

        // Add application routes to handle OAuth callbacks
        app.addRoute(
            (context) =>
                Promise.resolve(
                    context.activity.type === ActivityTypes.Invoke && context.activity.name === verifyStateOperationName
                ),
            async (context, state) => {
                await this.handleSignInActivity(context, state);
            },
            true
        );
        app.addRoute(
            (context) =>
                Promise.resolve(
                    context.activity.type === ActivityTypes.Invoke &&
                        context.activity.name === tokenExchangeOperationName
                ),
            async (context, state) => {
                await this.handleSignInActivity(context, state);
            },
            true
        );
    }

    public async authenticate(context: TurnContext, state: TState): Promise<string | undefined> {
        // Get property names to use
        const userAuthStatePropertyName = this.getUserAuthStatePropertyName(context);
        const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);

        // Save message if not signed in
        if (!this.getUserAuthState(context, state)) {
            (state.conversation as any)[userAuthStatePropertyName] = {
                message: context.activity.text
            };
        }

        const results = await this.runDialog(context, state, userDialogStatePropertyName);
        if (results.status === DialogTurnStatus.complete) {
            // Delete user auth state
            this.deleteAuthFlowState(context, state);

            if (results.result?.token) {
                // Return token
                return results.result?.token;
            } else {
                // Completed dialog without a token.
                // This could mean the user declined the consent prompt in the previous turn.
                // Retry authentication flow again.
                return await this.authenticate(context, state);
            }
        }

        return undefined;
    }

    public isValidActivity(context: TurnContext): boolean {
        // Should be a message activity with non-empty text property.
        return (
            context.activity.type === ActivityTypes.Message &&
            context.activity.text != null &&
            context.activity.text != undefined &&
            context.activity.text.length > 0
        );
    }

    /**
     * The handler function is called when the user has successfully signed in
     * @template TState
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler The handler function to call when the user has successfully signed in
     */
    public onUserSignInSuccess(handler: (context: TurnContext, state: TState) => Promise<void>): void {
        this._userSignInSuccessHandler = handler;
    }

    /**
     * The handler function is called when the user sign in flow fails
     * @template TState
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler The handler function to call when the user failed to signed in
     */
    public onUserSignInFailure(
        handler: (context: TurnContext, state: TState, error: AuthError) => Promise<void>
    ): void {
        this._userSignInFailureHandler = handler;
    }

    public async handleSignInActivity(context: TurnContext, state: TState): Promise<void> {
        try {
            const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
            const result = await this.runDialog(context, state, userDialogStatePropertyName);

            if (result.status === DialogTurnStatus.complete) {
                // OAuthPrompt dialog should have sent an invoke response already.

                if (result.result?.token) {
                    // Successful sign in
                    setTokenInState(state, this._settingName, result.result.token);

                    // Get user auth state
                    const userAuthState = this.getUserAuthState(context, state);

                    // Restore previous user message
                    context.activity.text = userAuthState.message || '';

                    await this._userSignInSuccessHandler?.(context, state);
                } else {
                    // Failed sign in
                    await this._userSignInFailureHandler?.(
                        context,
                        state,
                        new AuthError('Authentication flow completed without a token.', 'completionWithoutToken')
                    );
                }
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
            const message = `Unexpected error encountered while signing in: ${errorMessage}. 
                Incoming activity details: type: ${context.activity.type}, name: ${context.activity.name}`;

            await this._userSignInFailureHandler?.(context, state, new AuthError(message));
        }
    }

    public async runDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<TokenResponse>> {
        const accessor = new TurnStateProperty<DialogState>(state, 'conversation', dialogStateProperty);
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this._oauthPrompt);
        const dialogContext = await dialogSet.createContext(context);
        let results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            results = await dialogContext.beginDialog(this._oauthPrompt.id);
        }
        return results;
    }

    public deleteAuthFlowState(context: TurnContext, state: TState) {
        // Delete user auth state
        const userAuthStatePropertyName = this.getUserAuthStatePropertyName(context);
        if (this.getUserAuthState(context, state)) {
            delete (state.conversation as any)[userAuthStatePropertyName];
        }

        // Delete user dialog state
        const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
        if (this.getUserDialogState(context, state)) {
            delete (state.conversation as any)[userDialogStatePropertyName];
        }
    }

    public getUserAuthStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:${this._settingName}:Bot:AuthState__`;
    }

    public getUserDialogStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:${this._settingName}:DialogState__`;
    }

    private getUserAuthState(context: TurnContext, state: TState): UserAuthState {
        return (state.conversation as any)[this.getUserAuthStatePropertyName(context)] as UserAuthState;
    }

    private getUserDialogState(context: TurnContext, state: TState): DialogState {
        const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
        return (state.conversation as any)[userDialogStatePropertyName] as DialogState;
    }
}

/**
 * Sets the token in the turn state
 * @param {DefaultTurnState} state The turn state
 * @param {string} settingName The name of the setting
 * @param {string} token The token to set
 * @internal
 */
export function setTokenInState<TState extends TurnState>(state: TState, settingName: string, token: string) {
    if (!state.temp.authTokens) {
        state.temp.authTokens = {};
    }

    state.temp.authTokens[settingName] = token;
}

/**
 * Deletes the token from the turn state
 * @param {TurnState} state The turn state
 * @param {string} settingName The name of the setting
 */
export function deleteTokenFromState<TState extends TurnState>(state: TState, settingName: string) {
    if (!state.temp.authTokens || !state.temp.authTokens[settingName]) {
        return;
    }

    delete state.temp.authTokens[settingName];
}

/**
 * @internal
 * SSO Token Exchange Middleware for Teams that filters based on the connection name.
 */
class FilteredTeamsSSOTokenExchangeMiddleware extends TeamsSSOTokenExchangeMiddleware {
    private readonly _oauthConnectionName: string;

    public constructor(storage: Storage, oauthConnectionName: string) {
        super(storage, oauthConnectionName);
        this._oauthConnectionName = oauthConnectionName;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        // If connection name matches then continue to the Teams SSO Token Exchange Middleware.
        if (context.activity.value?.connectionName == this._oauthConnectionName) {
            await super.onTurn(context, next);
        } else {
            await next();
        }
    }
}
