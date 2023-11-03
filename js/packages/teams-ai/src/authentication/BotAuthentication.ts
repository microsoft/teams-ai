/* eslint-disable security/detect-object-injection */
import {
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
    OAuthPrompt,
    OAuthPromptSettings
} from 'botbuilder-dialogs';
import { DefaultTurnState } from '../DefaultTurnStateManager';
import { TurnState } from '../TurnState';
import { Application } from '../Application';
import {
    ActivityTypes,
    InvokeResponse,
    MemoryStorage,
    TeamsSSOTokenExchangeMiddleware,
    TurnContext,
    Storage,
    verifyStateOperationName,
    tokenExchangeOperationName
} from 'botbuilder';
import { TurnStateProperty } from '../TurnStateProperty';

/**
 * @internal
 */
interface OAuthPromptResult {
    connectionName: string;
    token: string;
}

/**
 * @internal
 */
interface UserAuthState {
    signedIn: boolean;
    message?: string;
}

/**
 * @internal
 */
export class BotAuthentication<TState extends TurnState = DefaultTurnState> {
    private _oauthPrompt: OAuthPrompt;
    private _storage: Storage;
    private _userSignInHandler?: (context: TurnContext, state: TState) => Promise<void>;
    private _connectionName: string;

    public constructor(app: Application<TState>, oauthPromptSettings: OAuthPromptSettings, storage?: Storage) {
        // Create OAuthPrompt
        this._oauthPrompt = new OAuthPrompt('OAuthPrompt', oauthPromptSettings);
        this._connectionName = oauthPromptSettings.connectionName;

        this._storage = storage || new MemoryStorage();

        // Handles deduplication of token exchange event when using SSO with Bot Authentication
        app.adapter.use(new TeamsSSOTokenExchangeMiddleware(this._storage, oauthPromptSettings.connectionName));

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
        if (!state.conversation.value[userAuthStatePropertyName]) {
            state.conversation.value[userAuthStatePropertyName] = {
                signedIn: false,
                message: context.activity.text
            };
        }

        const results = await this.runDialog(context, state, userDialogStatePropertyName);
        if (results.status === DialogTurnStatus.complete && results.result?.token) {
            // Get user auth state
            const userAuthState = state.conversation.value[userAuthStatePropertyName] as UserAuthState;
            if (!userAuthState.signedIn && userAuthState.message) {
                // Restore user message
                context.activity.text = userAuthState.message;
                state.conversation.value[userAuthStatePropertyName] = {
                    signedIn: true
                };
            }

            // Delete persisted dialog state
            delete state.conversation.value[userDialogStatePropertyName];

            // Return token
            return results.result?.token;
        } else {
            return undefined;
        }
    }

    public isValidActivity(context: TurnContext): boolean {
        return context.activity.type === ActivityTypes.Message;
    }

    /**
     * The handler function is called when the user has successfully signed in
     * @template TState
     * @param {(context: TurnContext, state: TState) => Promise<void>} handler The handler function to call when the user has successfully signed in
     */
    public async onUserSignIn(handler: (context: TurnContext, state: TState) => Promise<void>): Promise<void> {
        this._userSignInHandler = handler;
    }

    public async handleSignInActivity(context: TurnContext, state: TState): Promise<void> {
        const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
        const result = await this.runDialog(context, state, userDialogStatePropertyName);

        if (result.status === DialogTurnStatus.complete) {
            if (result.result?.token) {
                // Populate the token in the temp state
                state.temp.value.authToken = result.result.token;

                await context.sendActivity({
                    value: { status: 200 } as InvokeResponse,
                    type: ActivityTypes.InvokeResponse
                });

                // Successful sign in
                await this._userSignInHandler?.(context, state);
            } else {
                await context.sendActivity({
                    value: { status: 400 } as InvokeResponse,
                    type: ActivityTypes.InvokeResponse
                });
            }
        }
    }

    public async runDialog(
        context: TurnContext,
        state: TState,
        dialogStateProperty: string
    ): Promise<DialogTurnResult<OAuthPromptResult>> {
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
        if (state.conversation.value[userAuthStatePropertyName]) {
            delete state.conversation.value[userAuthStatePropertyName];
        }

        // Delete user dialog state
        const userDialogStatePropertyName = this.getUserDialogStatePropertyName(context);
        if (state.conversation.value[userDialogStatePropertyName]) {
            delete state.conversation.value[userDialogStatePropertyName];
        }
    }

    public getUserAuthStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:${this._connectionName}:AuthState__`;
    }

    public getUserDialogStatePropertyName(context: TurnContext): string {
        return `__${context.activity.from.id}:${this._connectionName}:DialogState__`;
    }
}
