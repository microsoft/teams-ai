import { DialogState, DialogTurnResult, DialogTurnStatus } from 'botbuilder-dialogs';
import { TurnState } from '../TurnState';
import { Application } from '../Application';
import {
    ActivityTypes,
    MemoryStorage,
    TurnContext,
    Storage,
    verifyStateOperationName,
    tokenExchangeOperationName,
    TokenResponse
} from 'botbuilder';
import { AuthError } from './Authentication';

/**
 * @internal
 */
interface UserAuthState {
    message?: string;
}

/**
 * @private
 */
const IS_SIGNED_IN_KEY = '__InSignInFlow__';

/**
 * @internal
 * Base class to handle Teams conversational bot authentication.
 * @template TState - The type of the turn state.
 */
export abstract class BotAuthenticationBase<TState extends TurnState> {
    protected _storage: Storage;
    protected _settingName: string;
    private _userSignInSuccessHandler?: (context: TurnContext, state: TState) => Promise<void>;
    private _userSignInFailureHandler?: (context: TurnContext, state: TState, error: AuthError) => Promise<void>;

    /**
     * Creates a new instance of BotAuthenticationBase.
     * @param {Application<TState>} app - The application instance.
     * @param {string} settingName - The name of the setting.
     * @param {Storage} [storage] - The storage to save states.
     */
    public constructor(app: Application<TState>, settingName: string, storage?: Storage) {
        this._settingName = settingName;

        this._storage = storage || new MemoryStorage();

        // Add application routes to handle OAuth callbacks
        app.addRoute(
            this.verifyStateRouteSelector.bind(this),
            async (context, state) => {
                await this.handleSignInActivity(context, state);
            },
            true
        );
        app.addRoute(
            this.tokenExchangeRouteSelector.bind(this),
            async (context, state) => {
                await this.handleSignInActivity(context, state);
            },
            true
        );
    }

    /**
     * Authenticates the user.
     * @param {TurnContext} context - The turn context.
     * @param {TState} state - The turn state.
     * @returns {Promise<string | undefined>} - The authentication token, or undefined if authentication failed.
     */
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

    /**
     * Checks if the activity is a valid message activity
     * @param {TurnContext} context - The turn context.
     * @returns {boolean} - True if the activity is a valid message activity.
     */
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

    /**
     * Handles the signin/verifyState activity. The onUserSignInSuccess and onUserSignInFailure handlers will be called based on the result.
     * @param {TurnContext} context - The turn context.
     * @param {TState} state - The turn state.
     */
    public async handleSignInActivity(context: TurnContext, state: TState): Promise<void> {
        try {
            const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
            const result = await this.continueDialog(context, state, userDialogStatePropertyName);

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

    /**
     * Deletes the user auth state and user dialog state from the turn state. So that the next message can start a new authentication flow.
     * @param {TurnContext} context - The turn context.
     * @param {TState} state - The turn state.
     */
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

    /**
     * Gets the property name for storing user authentication state.
     * @param {TurnContext} context - The turn context.
     * @returns {string} - The property name.
     */
    public getUserAuthStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:${this._settingName}:Bot:AuthState__`;
    }

    /**
     * Gets the property name for storing user dialog state.
     * @param {TurnContext} context - The turn context.
     * @returns {string} - The property name.
     */
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

    public async verifyStateRouteSelector(context: TurnContext): Promise<boolean> {
        return (
            context.activity.type === ActivityTypes.Invoke &&
            context.activity.name === verifyStateOperationName &&
            this._settingName == context.activity.value['settingName']
        );
    }

    public async tokenExchangeRouteSelector(context: TurnContext): Promise<boolean> {
        return (
            context.activity.type === ActivityTypes.Invoke &&
            context.activity.name === tokenExchangeOperationName &&
            this._settingName == context.activity.value['settingName']
        );
    }

    /**
     * Run or continue the authentication dialog.
     * @param {TurnContext} context - The turn context.
     * @param {TState} state - The turn state.
     * @param {string} dialogStateProperty - The property name for storing dialog state.
     * @returns {Promise<DialogTurnResult<TokenResponse>>} - A promise that resolves to the dialog turn result containing the token response.
     */
    public abstract runDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<TokenResponse>>;

    /**
     * Continues the authentication dialog.
     * @param {TurnContext} context - The turn context.
     * @param {TState} state - The turn state.
     * @param {string} dialogStateProperty - The property name for storing dialog state.
     * @returns {Promise<DialogTurnResult<TokenResponse>>} - A promise that resolves to the dialog turn result containing the token response.
     */
    public abstract continueDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<TokenResponse>>;
}

/**
 * Sets the setting name in the context.activity.value object.
 * The setting name is needed in signIn/verifyState` and `signIn/tokenExchange` route selector to accurately route to the correct authentication setting.
 * @param {TurnContext} context The turn context object
 * @param {string} settingName The auth setting name
 */
export function setSettingNameInContextActivityValue(context: TurnContext, settingName: string) {
    if (typeof context.activity.value == 'object') {
        context.activity.value['settingName'] = settingName;
    } else {
        context.activity.value = {
            settingName: settingName
        };
    }
}

/**
 * Sets the token in the turn state
 * @param {TurnState} state The turn state
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
 * Determines if the user is in the sign in flow.
 * @template TState
 * @param {TState} state - the turn state
 * @returns {string | undefined} The setting name if the user is in sign in flow. Otherwise, undefined.
 */
export function userInSignInFlow<TState extends TurnState>(state: TState): string | undefined {
    if (IS_SIGNED_IN_KEY in state.user && typeof state.user[IS_SIGNED_IN_KEY] == 'string') {
        // returns the connection name if the user is in the sign in flow
        return state.user[IS_SIGNED_IN_KEY];
    }

    return;
}

/**
 * Update the turn state to indicate the user is in the sign in flow by providing the authentication setting name used.
 * @template TState
 * @param {TState} state - the turn state
 * @param {string} settingName - the authentication setting name.
 */
export function setUserInSignInFlow<TState extends TurnState>(state: TState, settingName: string) {
    (state.user as any)[IS_SIGNED_IN_KEY] = settingName;
}

/**
 * Deletes the user sign in flow state from the turn state.
 * @template TState
 * Determines if the user is in the sign in flow.
 * @param {TState} state - the turn state
 */
export function deleteUserInSignInFlow<TState extends TurnState>(state: TState) {
    delete (state.user as any)[IS_SIGNED_IN_KEY];
}
