using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Function for handling Message Extension submitAction events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="data">The data that was submitted.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>An instance of MessagingExtensionActionResponse.</returns>
    public delegate Task<MessagingExtensionActionResponse> SubmitActionHandler<TState>(ITurnContext turnContext, TState turnState, object data, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension botMessagePreview edit events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="activityPreview">The activity that's being previewed by the user.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>An instance of MessagingExtensionActionResponse.</returns>
    public delegate Task<MessagingExtensionActionResponse> BotMessagePreviewEditHandler<TState>(ITurnContext turnContext, TState turnState, Activity activityPreview, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension botMessagePreview send events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="activityPreview">The activity that's being previewed by the user.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task BotMessagePreviewSendHandler<TState>(ITurnContext turnContext, TState turnState, Activity activityPreview, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension fetchTask events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>An instance of TaskModuleResponse.</returns>
    public delegate Task<TaskModuleResponse> FetchTaskHandler<TState>(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension query events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="query">The query parameters that were sent by the client.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>An instance of MessagingExtensionResult.</returns>
    public delegate Task<MessagingExtensionResult> QueryHandler<TState>(ITurnContext turnContext, TState turnState, Query<Dictionary<string, object>> query, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension selecting item events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="item">The item that was selected.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>An instance of MessagingExtensionResult.</returns>
    public delegate Task<MessagingExtensionResult> SelectItemHandler<TState>(ITurnContext turnContext, TState turnState, object item, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension link unfurling events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="url">The URL that should be unfurled.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>An instance of MessagingExtensionResult.</returns>
    public delegate Task<MessagingExtensionResult> QueryLinkHandler<TState>(ITurnContext turnContext, TState turnState, string url, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension configuring query setting url events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>An instance of MessagingExtensionResult.</returns>
    public delegate Task<MessagingExtensionResult> QueryUrlSettingHandler<TState>(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension configuring settings events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="settings">The configuration settings that was submitted.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task ConfigureSettingsHandler<TState>(ITurnContext turnContext, TState turnState, object settings, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;

    /// <summary>
    /// Function for handling Message Extension clicking card button events.
    /// </summary>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    /// <param name="turnContext">A strongly-typed context object for this turn.</param>
    /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
    /// <param name="cardData">The card data.</param>
    /// <param name="cancellationToken">A cancellation token that can be used by other objects
    /// or threads to receive notice of cancellation.</param>
    /// <returns>A task that represents the work queued to execute.</returns>
    public delegate Task CardButtonClickedHandler<TState>(ITurnContext turnContext, TState turnState, object cardData, CancellationToken cancellationToken) where TState : ITurnState<StateBase, StateBase, TempState>;
}
