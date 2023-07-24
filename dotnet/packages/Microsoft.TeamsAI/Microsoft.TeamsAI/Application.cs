using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using System.Net;
using Microsoft.TeamsAI.Exceptions;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.TeamsAI.AI;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Builder.Teams;
using Microsoft.TeamsAI.Utilities;
using Microsoft.TeamsAI.State;
using Microsoft.Bot.Builder;

namespace Microsoft.TeamsAI
{
    /// <summary>
    /// Application class for routing and processing incoming requests
    /// </summary>
    /// <remarks>
    /// The Application object replaces the traditional ActivityHandler that a bot would use. It supports
    /// a simpler fluent style of authoring bots versus the inheritance based approach used by the
    /// ActivityHandler class.
    ///
    /// Additionally, it has built-in support for calling into the SDK's AI system and can be used to create
    /// bots that leverage Large Language Models (LLM) and other AI capabilities.
    /// </remarks>
    /// <typeparam name="TState">Type of the turn state. This allows for strongly typed access to the turn state.</typeparam>
    public class Application<TState, TTurnStateManager> : IBot
        where TState : ITurnState<StateBase, StateBase, TempState>
        where TTurnStateManager : ITurnStateManager<TState>, new()
    {
        private readonly AI<TState>? _ai;
        private readonly int _typingTimerDelay = 1000;

        /// <summary>
        /// Creates a new Application instance.
        /// </summary>
        /// <param name="options">Optional. Options used to configure the application.</param>
        public Application(ApplicationOptions<TState, TTurnStateManager> options)
        {
            Verify.ParamNotNull(options);

            Options = options;

            Options.TurnStateManager ??= new TTurnStateManager();

            if (Options.AI != null)
            {
                _ai = new AI<TState>(Options.AI, Options.Logger);
            }

            // Validate long running messages configuration
            if (Options.LongRunningMessages == true && (Options.Adapter == null || Options.BotAppId == null))
            {
                throw new Exception("The ApplicationOptions.LongRunningMessages property is unavailable because no adapter or botAppId was configured.");
            }

        }

        /// <summary>
        /// Fluent interface for accessing AI specific features.
        /// </summary>
        /// <remarks>
        /// This property is only available if the Application was configured with 'ai' options. An
        /// exception will be thrown if you attempt to access it otherwise.
        /// </remarks>
        public AI<TState> AI
        {
            get
            {
                if (_ai == null)
                {
                    throw new Exception("The Application.AI property is unavailable because no AI options were configured.");
                }

                return _ai;
            }
        }

        /// <summary>
        /// The application's configured options.
        /// </summary>
        public ApplicationOptions<TState, TTurnStateManager> Options { get; }

        /// <summary>
        /// Handler that will execute before the turn's activity handler logic is processed.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>True to continue execution of the current turn. Otherwise, return False.</returns>
        protected virtual Task<bool> OnBeforeTurnAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken)
        {
            return Task.FromResult(true);
        }

        /// <summary>
        /// Handler that will execute after the turn's activity handler logic is processed.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>True to continue execution of the current turn. Otherwise, return False.</returns>
        protected virtual Task<bool> OnAfterTurnAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken)
        {
            return Task.FromResult(true);
        }


        /// <summary>
        /// Called by the adapter (for example, a <see cref="CloudAdapter"/>)
        /// at runtime in order to process an inbound <see cref="Activity"/>.
        /// </summary>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// This method calls other methods in this class based on the type of the activity to
        /// process, which allows a derived class to provide type-specific logic in a controlled way.
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is responsible for
        /// routing the activity to the appropriate type-specific handler.
        /// </remarks>
        /// <seealso cref="OnMessageActivityAsync(ITurnContext{IMessageActivity}, TState, CancellationToken)"/>
        public async Task OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            if (turnContext == null)
            {
                throw new ArgumentNullException(nameof(turnContext));
            }

            if (turnContext.Activity == null)
            {
                throw new ArgumentException($"{nameof(turnContext)} must have non-null Activity.");
            }

            if (turnContext.Activity.Type == null)
            {
                throw new ArgumentException($"{nameof(turnContext)}.Activity must have non-null Type.");
            }

            await _StartLongRunningCall(turnContext, _OnTurnAsync, cancellationToken);
        }

        /// <summary>
        /// Internal method to wrap the logic of handling a bot turn.
        /// </summary>
        private async Task _OnTurnAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            TypingTimer? timer = null;

            try
            {
                // Start typing timer if configured
                if (Options.StartTypingTimer)
                {
                    timer = new TypingTimer(_typingTimerDelay);
                    timer.Start(turnContext);
                };

                // Remove @mentions
                if (Options.RemoveRecipientMention && ActivityTypes.Message.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase))
                {
                    turnContext.Activity.Text = turnContext.Activity.RemoveRecipientMention();
                }

                ITurnStateManager<TState>? turnStateManager = Options.TurnStateManager;
                IStorage? storage = Options.Storage;

                TState turnState = await turnStateManager!.LoadStateAsync(storage, turnContext);

                // Call before activity handler
                if (!await OnBeforeTurnAsync(turnContext, turnState, cancellationToken))
                {
                    // Save turn state
                    // - This lets the bot keep track of why it ended the previous turn. It also
                    //   allows the dialog system to be used before the AI system is called.
                    await turnStateManager!.SaveStateAsync(storage, turnContext, turnState);

                    return;
                };

                // Call activity type specific handler
                bool eventHandlerCalled = await RunActivityHandlerAsync(turnContext, turnState, cancellationToken);

                if (!eventHandlerCalled && _ai != null && ActivityTypes.Message.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase) && turnContext.Activity.Text != null)
                {
                    // Begin a new chain of AI calls
                    await _ai.ChainAsync(turnContext, turnState);
                }

                // Call after turn activity handler
                if (await OnAfterTurnAsync(turnContext, turnState, cancellationToken))
                {
                    await turnStateManager!.SaveStateAsync(storage, turnContext, turnState);
                };
            }
            finally
            {
                // Dipose the timer if configured
                timer?.Dispose();
            }
        }

        /// <summary>
        /// Called by the <see cref="OnTurnAsync(ITurnContext, CancellationToken)"/>
        /// at runtime in order to dispatch the appropriate handler method.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>True if and only if the executed handler method was implemented. That is, the handler method does not
        /// throw a <see cref="NotImplementedException"/>.</returns>
        /// <remarks>
        /// This method calls other methods in this class based on the type of the activity to
        /// process, which allows a derived class to provide type-specific logic in a controlled way.
        ///
        /// In a derived class, override this method to add logic that applies to all activity types.
        /// To add logic to apply before the type-specific logic override the
        /// <see cref="OnBeforeTurnAsync(ITurnContext, TState, CancellationToken)"/> method.
        ///  To add logic to apply after the type-specific logic override the
        /// <see cref="OnAfterTurnAsync(ITurnContext, TState, CancellationToken)"/> method.
        /// </remarks>
        /// <seealso cref="OnMessageActivityAsync(ITurnContext{IMessageActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnMessageUpdateActivityAsync(ITurnContext{IMessageUpdateActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnMessageDeleteActivityAsync(ITurnContext{IMessageDeleteActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnMessageReactionActivityAsync(ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnUnrecognizedActivityTypeAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="Activity.Type"/>
        /// <seealso cref="ActivityTypes"/>
        public async Task<bool> RunActivityHandlerAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken)
        {
            try
            {
                switch (turnContext.Activity.Type)
                {
                    case ActivityTypes.Message:
                        await OnMessageActivityAsync(new DelegatingTurnContext<IMessageActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.MessageUpdate:
                        await OnMessageUpdateActivityAsync(new DelegatingTurnContext<IMessageUpdateActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.MessageDelete:
                        await OnMessageDeleteActivityAsync(new DelegatingTurnContext<IMessageDeleteActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.ConversationUpdate:
                        await OnConversationUpdateActivityAsync(new DelegatingTurnContext<IConversationUpdateActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.MessageReaction:
                        await OnMessageReactionActivityAsync(new DelegatingTurnContext<IMessageReactionActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.Event:
                        await OnEventActivityAsync(new DelegatingTurnContext<IEventActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.Invoke:
                        InvokeResponse invokeResponse = await OnInvokeActivityAsync(new DelegatingTurnContext<IInvokeActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);

                        // If OnInvokeActivityAsync has already sent an InvokeResponse, do not send another one.
                        if (invokeResponse != null && turnContext.TurnState.Get<Activity>(BotAdapter.InvokeResponseKey) == null)
                        {
                            await turnContext.SendActivityAsync(new Activity { Value = invokeResponse, Type = ActivityTypesEx.InvokeResponse }, cancellationToken).ConfigureAwait(false);
                        }

                        break;

                    case ActivityTypes.EndOfConversation:
                        await OnEndOfConversationActivityAsync(new DelegatingTurnContext<IEndOfConversationActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.Typing:
                        await OnTypingActivityAsync(new DelegatingTurnContext<ITypingActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.InstallationUpdate:
                        await OnInstallationUpdateActivityAsync(new DelegatingTurnContext<IInstallationUpdateActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.Command:
                        await OnCommandActivityAsync(new DelegatingTurnContext<ICommandActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    case ActivityTypes.CommandResult:
                        await OnCommandResultActivityAsync(new DelegatingTurnContext<ICommandResultActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);
                        break;

                    default:
                        await OnUnrecognizedActivityTypeAsync(turnContext, turnState, cancellationToken).ConfigureAwait(false);
                        break;
                }

            }
            catch (NotImplementedException)
            {
                return false;
            }

            return true;
        }

        /// <summary>
        /// An <see cref="InvokeResponse"/> factory that initializes the body to the parameter passed and status equal to OK.
        /// </summary>
        /// <param name="body">JSON serialized content from a POST response.</param>
        /// <returns>A new <see cref="InvokeResponse"/> object.</returns>
        protected static InvokeResponse CreateInvokeResponse(object? body)
        {
            return new InvokeResponse { Status = (int)HttpStatusCode.OK, Body = body };
        }

        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.Message"/> activities, such as the conversational logic.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.MessageUpdate"/> activities, such as the conversational logic.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message update activity, it calls this method.
        /// If it is a message edit event, it calls
        /// <see cref="OnMessageEditAsync(ITurnContext{IMessageUpdateActivity}, TState, CancellationToken)"/>.
        /// If it is a message undelete event, it calls
        /// <see cref="OnMessageUndeleteAsync(ITurnContext{IMessageUpdateActivity}, TState, CancellationToken)"/>.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnMessageUpdateActivityAsync(ITurnContext<IMessageUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            if (turnContext.Activity.ChannelId == Channels.Msteams)
            {
                TeamsChannelData? channelData = turnContext.Activity.GetChannelData<TeamsChannelData>();

                if (channelData != null)
                {
                    switch (channelData.EventType)
                    {
                        case "editMessage":
                            return OnMessageEditAsync(turnContext, turnState, cancellationToken);

                        case "undeleteMessage":
                            return OnMessageUndeleteAsync(turnContext, turnState, cancellationToken);

                    }
                }
            }

            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a edit message event activity is received.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMessageEditAsync(ITurnContext<IMessageUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a undo soft delete message event activity is received.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMessageUndeleteAsync(ITurnContext<IMessageUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.MessageDelete"/> activities, such as the conversational logic.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message delete activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnMessageDeleteActivityAsync(ITurnContext<IMessageDeleteActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            if (turnContext.Activity.ChannelId == Channels.Msteams)
            {
                TeamsChannelData? channelData = turnContext.Activity.GetChannelData<TeamsChannelData>();

                if (channelData != null)
                {
                    switch (channelData.EventType)
                    {
                        case "softDeleteMessage":
                            return OnMessageSoftDeleteAsync(turnContext, turnState, cancellationToken);
                    }
                }
            }

            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a soft delete message event activity is received.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMessageSoftDeleteAsync(ITurnContext<IMessageDeleteActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a conversation update activity is received from the channel when the base behavior of
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// Conversation update activities are useful when it comes to responding to users being added to or removed from the conversation.
        /// For example, a bot could respond to a user being added by greeting the user.
        /// By default, this method will call <see cref="OnMembersAddedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// if any users have been added or <see cref="OnMembersRemovedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// if any users have been removed. The method checks the member ID so that it only responds to updates regarding members other than the bot itself.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a conversation update activity, it calls this method.
        /// If the conversation update activity indicates that members other than the bot joined the conversation, it calls
        /// <see cref="OnMembersAddedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>.
        /// If the conversation update activity indicates that members other than the bot left the conversation, it calls
        /// <see cref="OnMembersRemovedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>.
        ///
        /// In a derived class, override this method to add logic that applies to all conversation update activities.
        /// Add logic to apply before the member added or removed logic before the call to the base class
        /// <see cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/> method.
        /// Add logic to apply after the member added or removed logic after the call to the base class
        /// <see cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/> method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnMembersAddedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnMembersRemovedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        protected virtual Task OnConversationUpdateActivityAsync(ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            if (turnContext.Activity.ChannelId == Channels.Msteams)
            {
                TeamsChannelData? channelData = turnContext.Activity.GetChannelData<TeamsChannelData>();

                if (turnContext.Activity.MembersAdded != null)
                {
                    return OnMembersAddedDispatchAsync(turnContext.Activity.MembersAdded, channelData?.Team, turnContext, turnState, cancellationToken);
                }

                if (turnContext.Activity.MembersRemoved != null)
                {
                    return OnMembersRemovedDispatchAsync(turnContext.Activity.MembersRemoved, channelData?.Team, turnContext, turnState, cancellationToken);
                }

                if (channelData != null)
                {
                    switch (channelData.EventType)
                    {
                        case "channelCreated":
                            return OnChannelCreatedAsync(channelData.Channel, channelData.Team, turnContext, turnState, cancellationToken);

                        case "channelDeleted":
                            return OnChannelDeletedAsync(channelData.Channel, channelData.Team, turnContext, turnState, cancellationToken);

                        case "channelRenamed":
                            return OnChannelRenamedAsync(channelData.Channel, channelData.Team, turnContext, turnState, cancellationToken);

                        case "channelRestored":
                            return OnChannelRestoredAsync(channelData.Channel, channelData.Team, turnContext, turnState, cancellationToken);

                        case "teamArchived":
                            return OnTeamArchivedAsync(channelData.Team, turnContext, turnState, cancellationToken);

                        case "teamDeleted":
                            return OnTeamDeletedAsync(channelData.Team, turnContext, turnState, cancellationToken);

                        case "teamHardDeleted":
                            return OnTeamHardDeletedAsync(channelData.Team, turnContext, turnState, cancellationToken);

                        case "teamRenamed":
                            return OnTeamRenamedAsync(channelData.Team, turnContext, turnState, cancellationToken);

                        case "teamRestored":
                            return OnTeamRestoredAsync(channelData.Team, turnContext, turnState, cancellationToken);

                        case "teamUnarchived":
                            return OnTeamUnarchivedAsync(channelData.Team, turnContext, turnState, cancellationToken);

                        default:
                            break;
                    }
                }
            }

            if (turnContext.Activity.MembersAdded != null && turnContext.Activity.MembersAdded.Any(m => m.Id != turnContext.Activity.Recipient?.Id))
            {
                return OnMembersAddedAsync(turnContext.Activity.MembersAdded, turnContext, turnState, cancellationToken);
            }
            else if (turnContext.Activity.MembersRemoved != null && turnContext.Activity.MembersRemoved.Any(m => m.Id != turnContext.Activity.Recipient?.Id))
            {
                return OnMembersRemovedAsync(turnContext.Activity.MembersRemoved, turnContext, turnState, cancellationToken);
            }

            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when members other than the bot
        /// join the channel, such as your bot's welcome logic.
        /// UseIt will get the associated members with the provided accounts.
        /// </summary>
        /// <param name="membersAdded">A list of all the accounts added to the channel, as
        /// described by the conversation update activity.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual async Task OnMembersAddedDispatchAsync(IList<ChannelAccount> membersAdded, TeamInfo? teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            List<TeamsChannelAccount> teamsMembersAdded = new();
            foreach (ChannelAccount memberAdded in membersAdded)
            {
                if (memberAdded.Properties.HasValues || memberAdded.Id == turnContext.Activity?.Recipient?.Id)
                {
                    // when the ChannelAccount object is fully a TeamsChannelAccount, or the bot (when Teams changes the service to return the full details)
                    teamsMembersAdded.Add(JObject.FromObject(memberAdded).ToObject<TeamsChannelAccount>()!);
                }
                else
                {
                    TeamsChannelAccount? newMemberInfo = null;
                    try
                    {
                        newMemberInfo = await TeamsInfo.GetMemberAsync(turnContext, memberAdded.Id, cancellationToken).ConfigureAwait(false);
                    }
                    catch (ErrorResponseException ex)
                    {
                        if (ex.Body?.Error?.Code != "ConversationNotFound")
                        {
                            throw;
                        }

                        // unable to find the member added in ConversationUpdate Activity in the response from the GetMemberAsync call
                        newMemberInfo = new TeamsChannelAccount
                        {
                            Id = memberAdded.Id,
                            Name = memberAdded.Name,
                            AadObjectId = memberAdded.AadObjectId,
                            Role = memberAdded.Role,
                        };
                    }

                    teamsMembersAdded.Add(newMemberInfo);
                }
            }

            await OnMembersAddedAsync(teamsMembersAdded, teamInfo, turnContext, turnState, cancellationToken).ConfigureAwait(false);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when members other than the bot
        /// leave the channel, such as your bot's good-bye logic.
        /// It will get the associated members with the provided accounts.
        /// </summary>
        /// <param name="membersRemoved">A list of all the accounts removed from the channel, as
        /// described by the conversation update activity.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMembersRemovedDispatchAsync(IList<ChannelAccount> membersRemoved, TeamInfo? teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            List<TeamsChannelAccount> teamsMembersRemoved = new();
            foreach (ChannelAccount memberRemoved in membersRemoved)
            {
                teamsMembersRemoved.Add(JObject.FromObject(memberRemoved).ToObject<TeamsChannelAccount>()!);
            }

            return OnMembersRemovedAsync(teamsMembersRemoved, teamInfo, turnContext, turnState, cancellationToken);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when members other than the bot
        /// join the channel, such as your bot's welcome logic.
        /// </summary>
        /// <param name="teamsMembersAdded">A list of all the members added to the channel, as
        /// described by the conversation update activity.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMembersAddedAsync(IList<TeamsChannelAccount> teamsMembersAdded, TeamInfo? teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            return OnMembersAddedAsync(teamsMembersAdded.Cast<ChannelAccount>().ToList(), turnContext, turnState, cancellationToken);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when members other than the bot
        /// leave the channel, such as your bot's good-bye logic.
        /// </summary>
        /// <param name="teamsMembersRemoved">A list of all the members removed from the channel, as
        /// described by the conversation update activity.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMembersRemovedAsync(IList<TeamsChannelAccount> teamsMembersRemoved, TeamInfo? teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            return OnMembersRemovedAsync(teamsMembersRemoved.Cast<ChannelAccount>().ToList(), turnContext, turnState, cancellationToken);
        }

        /// <summary>
        /// Invoked when a Channel Created event activity is received from the connector.
        /// Channel Created correspond to the user creating a new channel.
        /// </summary>
        /// <param name="channelInfo">The channel info object which describes the channel.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnChannelCreatedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Channel Deleted event activity is received from the connector.
        /// Channel Deleted correspond to the user deleting an existing channel.
        /// </summary>
        /// <param name="channelInfo">The channel info object which describes the channel.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnChannelDeletedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Channel Renamed event activity is received from the connector.
        /// Channel Renamed correspond to the user renaming an existing channel.
        /// </summary>
        /// <param name="channelInfo">The channel info object which describes the channel.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnChannelRenamedAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Channel Restored event activity is received from the connector.
        /// Channel Restored correspond to the user restoring a previously deleted channel.
        /// </summary>
        /// <param name="channelInfo">The channel info object which describes the channel.</param>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnChannelRestoredAsync(ChannelInfo channelInfo, TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Team Archived event activity is received from the connector.
        /// Team Archived correspond to the user archiving a team.
        /// </summary>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnTeamArchivedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Team Deleted event activity is received from the connector.
        /// Team Deleted corresponds to the user deleting a team.
        /// </summary>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnTeamDeletedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Team Hard Deleted event activity is received from the connector.
        /// Team Hard Deleted corresponds to the user hard deleting a team.
        /// </summary>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnTeamHardDeletedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Team Renamed event activity is received from the connector.
        /// Team Renamed correspond to the user renaming an existing team.
        /// </summary>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnTeamRenamedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Team Restored event activity is received from the connector.
        /// Team Restored corresponds to the user restoring a team.
        /// </summary>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnTeamRestoredAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Team Unarchived event activity is received from the connector.
        /// Team Unarchived correspond to the user unarchiving a team.
        /// </summary>
        /// <param name="teamInfo">The team info object representing the team.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnTeamUnarchivedAsync(TeamInfo teamInfo, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when members other than the bot
        /// join the conversation, such as your bot's welcome logic.
        /// </summary>
        /// <param name="membersAdded">A list of all the members added to the conversation, as
        /// described by the conversation update activity.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// method receives a conversation update activity that indicates one or more users other than the bot
        /// are joining the conversation, it calls this method.
        /// </remarks>
        /// <seealso cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        protected virtual Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when members other than the bot
        /// leave the conversation, such as your bot's good-bye logic.
        /// </summary>
        /// <param name="membersRemoved">A list of all the members removed from the conversation, as
        /// described by the conversation update activity.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// method receives a conversation update activity that indicates one or more users other than the bot
        /// are leaving the conversation, it calls this method.
        /// </remarks>
        /// <seealso cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        protected virtual Task OnMembersRemovedAsync(IList<ChannelAccount> membersRemoved, ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when an event activity is received from the connector when the base behavior of
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// Message reactions correspond to the user adding a 'like' or 'sad' etc. (often an emoji) to a
        /// previously sent activity. Message reactions are only supported by a few channels.
        /// The activity that the message reaction corresponds to is indicated in the replyToId property.
        /// The value of this property is the activity id of a previously sent activity given back to the
        /// bot as the response from a send call.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message reaction activity, it calls this method.
        /// If the message reaction indicates that reactions were added to a message, it calls
        /// <see cref="OnReactionsAddedAsync(IList{MessageReaction}, ITurnContext{IMessageReactionActivity}, CancellationToken)"/>.
        /// If the message reaction indicates that reactions were removed from a message, it calls
        /// <see cref="OnReactionsRemovedAsync(IList{MessageReaction}, ITurnContext{IMessageReactionActivity}, CancellationToken)"/>.
        ///
        /// In a derived class, override this method to add logic that applies to all message reaction activities.
        /// Add logic to apply before the reactions added or removed logic before the call to the base class
        /// <see cref="OnMessageReactionActivityAsync(ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/> method.
        /// Add logic to apply after the reactions added or removed logic after the call to the base class
        /// <see cref="OnMessageReactionActivityAsync(ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/> method.
        ///
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnReactionsAddedAsync(IList{MessageReaction}, ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnReactionsRemovedAsync(IList{MessageReaction}, ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        protected virtual async Task OnMessageReactionActivityAsync(ITurnContext<IMessageReactionActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            bool reactionsAddedNotImplemented = false;
            bool reactionsRemovedNotImplemented = false;

            if (turnContext.Activity.ReactionsAdded != null)
            {
                try
                {
                    await OnReactionsAddedAsync(turnContext.Activity.ReactionsAdded, turnContext, turnState, cancellationToken).ConfigureAwait(false);
                }
                catch (NotImplementedException)
                {
                    reactionsAddedNotImplemented = true;
                }
            }

            if (turnContext.Activity.ReactionsRemoved != null)
            {
                try
                {
                    await OnReactionsRemovedAsync(turnContext.Activity.ReactionsRemoved, turnContext, turnState, cancellationToken).ConfigureAwait(false);
                }
                catch (NotImplementedException)
                {
                    reactionsRemovedNotImplemented = true;
                }

                if (turnContext.Activity.ReactionsAdded == null && turnContext.Activity.ReactionsRemoved == null || reactionsAddedNotImplemented && reactionsRemovedNotImplemented)
                {
                    throw new NotImplementedException();
                }
            }
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when reactions to a previous activity
        /// are added to the conversation.
        /// </summary>
        /// <param name="messageReactions">The list of reactions added.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// Message reactions correspond to the user adding a 'like' or 'sad' etc. (often an emoji) to a
        /// previously sent message on the conversation. Message reactions are supported by only a few channels.
        /// The activity that the message is in reaction to is identified by the activity's
        /// <see cref="Activity.ReplyToId"/> property. The value of this property is the activity ID
        /// of a previously sent activity. When the bot sends an activity, the channel assigns an ID to it,
        /// which is available in the <see cref="ResourceResponse.Id"/> of the result.
        /// </remarks>
        /// <seealso cref="OnMessageReactionActivityAsync(ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        /// <seealso cref="Activity.Id"/>
        /// <seealso cref="ITurnContext.SendActivityAsync(IActivity, CancellationToken)"/>
        /// <seealso cref="ResourceResponse.Id"/>
        protected virtual Task OnReactionsAddedAsync(IList<MessageReaction> messageReactions, ITurnContext<IMessageReactionActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when reactions to a previous activity
        /// are removed from the conversation.
        /// </summary>
        /// <param name="messageReactions">The list of reactions removed.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// Message reactions correspond to the user adding a 'like' or 'sad' etc. (often an emoji) to a
        /// previously sent message on the conversation. Message reactions are supported by only a few channels.
        /// The activity that the message is in reaction to is identified by the activity's
        /// <see cref="Activity.ReplyToId"/> property. The value of this property is the activity ID
        /// of a previously sent activity. When the bot sends an activity, the channel assigns an ID to it,
        /// which is available in the <see cref="ResourceResponse.Id"/> of the result.
        /// </remarks>
        /// <seealso cref="OnMessageReactionActivityAsync(ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        /// <seealso cref="Activity.Id"/>
        /// <seealso cref="ITurnContext.SendActivityAsync(IActivity, CancellationToken)"/>
        /// <seealso cref="ResourceResponse.Id"/>
        protected virtual Task OnReactionsRemovedAsync(IList<MessageReaction> messageReactions, ITurnContext<IMessageReactionActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when an event activity is received from the connector when the base behavior of
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// Event activities can be used to communicate many different things.
        /// By default, this method will call <see cref="OnTokenResponseEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/> if the
        /// activity's name is <c>tokens/response</c> or <see cref="OnEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/> otherwise.
        /// A <c>tokens/response</c> event can be triggered by an <see cref="OAuthCard"/>.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives an event activity, it calls this method.
        /// If the event <see cref="IEventActivity.Name"/> is `tokens/response`, it calls
        /// <see cref="OnTokenResponseEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>;
        /// otherwise, it calls <see cref="OnEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>.
        ///
        /// In a derived class, override this method to add logic that applies to all event activities.
        /// Add logic to apply before the specific event-handling logic before the call to the base class
        /// <see cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/> method.
        /// Add logic to apply after the specific event-handling logic after the call to the base class
        /// <see cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/> method.
        ///
        /// Event activities communicate programmatic information from a client or channel to a bot.
        /// The meaning of an event activity is defined by the <see cref="IEventActivity.Name"/> property,
        /// which is meaningful within the scope of a channel.
        /// A `tokens/response` event can be triggered by an <see cref="OAuthCard"/> or an OAuth prompt.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnTokenResponseEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        protected virtual Task OnEventActivityAsync(ITurnContext<IEventActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            if (turnContext.Activity.ChannelId == Channels.Msteams)
            {
                switch (turnContext.Activity.Name)
                {
                    case "application/vnd.microsoft.readReceipt":
                        return OnReadReceiptAsync(JObject.FromObject(turnContext.Activity.Value).ToObject<ReadReceiptInfo>()!, turnContext, turnState, cancellationToken);
                    case "application/vnd.microsoft.meetingStart":
                        return OnMeetingStartAsync(JObject.FromObject(turnContext.Activity.Value).ToObject<MeetingStartEventDetails>()!, turnContext, turnState, cancellationToken);
                    case "application/vnd.microsoft.meetingEnd":
                        return OnMeetingEndAsync(JObject.FromObject(turnContext.Activity.Value).ToObject<MeetingEndEventDetails>()!, turnContext, turnState, cancellationToken);
                }
            }

            if (SignInConstants.TokenResponseEventName.Equals(turnContext.Activity.Name, StringComparison.OrdinalIgnoreCase))
            {
                return OnTokenResponseEventAsync(turnContext, turnState, cancellationToken);
            }

            return OnEventAsync(turnContext, turnState, cancellationToken);
        }

        /// <summary>
        /// Invoked when a <c>tokens/response</c> event is received when the base behavior of
        /// <see cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/> is used.
        /// If using an <c>OAuthPrompt</c>, override this method to forward this <see cref="Activity"/> to the current dialog.
        /// By default, this method does nothing.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// method receives an event with a <see cref="IEventActivity.Name"/> of `tokens/response`,
        /// it calls this method.
        ///
        /// If your bot uses the <c>OAuthPrompt</c>, forward the incoming <see cref="Activity"/> to
        /// the current dialog.
        /// </remarks>
        /// <seealso cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        protected virtual Task OnTokenResponseEventAsync(ITurnContext<IEventActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when an event other than <c>tokens/response</c> is received when the base behavior of
        /// <see cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/> is used.
        /// This method could optionally be overridden if the bot is meant to handle miscellaneous events.
        /// By default, this method does nothing.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// method receives an event with a <see cref="IEventActivity.Name"/> other than `tokens/response`,
        /// it calls this method.
        /// </remarks>
        /// <seealso cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnTokenResponseEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        protected virtual Task OnEventAsync(ITurnContext<IEventActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when an invoke activity is received from the connector when the base behavior of
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// Invoke activities can be used to communicate many different things.
        /// By default, this method will call <see cref="OnSignInInvokeAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/> if the
        /// activity's name is <c>signin/verifyState</c> or <c>signin/tokenExchange</c>.
        /// A <c>signin/verifyState</c> or <c>signin/tokenExchange</c> invoke can be triggered by an <see cref="OAuthCard"/>.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives an invoke activity, it calls this method.
        /// If the event <see cref="IInvokeActivity.Name"/> is `signin/verifyState` or `signin/tokenExchange`, it calls
        /// <see cref="OnSignInInvokeAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        /// Invoke activities communicate programmatic commands from a client or channel to a bot.
        /// The meaning of an invoke activity is defined by the <see cref="IInvokeActivity.Name"/> property,
        /// which is meaningful within the scope of a channel.
        /// A `signin/verifyState` or `signin/tokenExchange` invoke can be triggered by an <see cref="OAuthCard"/> or an OAuth prompt.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual async Task<InvokeResponse> OnInvokeActivityAsync(ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            try
            {
                if (turnContext.Activity.Name == null && turnContext.Activity.ChannelId == Channels.Msteams)
                {
                    return await OnCardActionInvokeAsync(turnContext, turnState, cancellationToken).ConfigureAwait(false);
                }
                else
                {
                    switch (turnContext.Activity.Name)
                    {
                        case "fileConsent/invoke":
                            return await OnFileConsentAsync(SafeCast<FileConsentCardResponse>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false);

                        case "actionableMessage/executeAction":
                            await OnO365ConnectorCardActionAsync(SafeCast<O365ConnectorCardActionQuery>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false);
                            return CreateInvokeResponse(null);

                        case "composeExtension/queryLink":
                            return CreateInvokeResponse(await OnAppBasedLinkQueryAsync(SafeCast<AppBasedLinkQuery>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "composeExtension/anonymousQueryLink":
                            return CreateInvokeResponse(await OnAnonymousAppBasedLinkQueryAsync(SafeCast<AppBasedLinkQuery>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "composeExtension/query":
                            return CreateInvokeResponse(await OnMessagingExtensionQueryAsync(SafeCast<MessagingExtensionQuery>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "composeExtension/selectItem":
                            return CreateInvokeResponse(await OnMessagingExtensionSelectItemAsync((turnContext.Activity.Value as JObject)!, turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "composeExtension/submitAction":
                            return CreateInvokeResponse(await OnMessagingExtensionSubmitActionDispatchAsync(SafeCast<MessagingExtensionAction>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "composeExtension/fetchTask":
                            return CreateInvokeResponse(await OnMessagingExtensionFetchTaskAsync(SafeCast<MessagingExtensionAction>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "composeExtension/querySettingUrl":
                            return CreateInvokeResponse(await OnMessagingExtensionConfigurationQuerySettingUrlAsync(SafeCast<MessagingExtensionQuery>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "composeExtension/setting":
                            await OnMessagingExtensionConfigurationSettingAsync((turnContext.Activity.Value as JObject)!, turnContext, turnState, cancellationToken).ConfigureAwait(false);
                            return CreateInvokeResponse(null);

                        case "composeExtension/onCardButtonClicked":
                            await OnMessagingExtensionCardButtonClickedAsync((turnContext.Activity.Value as JObject)!, turnContext, turnState, cancellationToken).ConfigureAwait(false);
                            return CreateInvokeResponse(null);

                        case "task/fetch":
                            return CreateInvokeResponse(await OnTaskModuleFetchAsync(SafeCast<TaskModuleRequest>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "task/submit":
                            return CreateInvokeResponse(await OnTaskModuleSubmitAsync(SafeCast<TaskModuleRequest>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "tab/fetch":
                            return CreateInvokeResponse(await OnTabFetchAsync(SafeCast<TabRequest>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "tab/submit":
                            return CreateInvokeResponse(await OnTabSubmitAsync(SafeCast<TabSubmit>(turnContext.Activity.Value), turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "application/search":
                            SearchInvokeValue searchInvokeValue = GetSearchInvokeValue(turnContext.Activity);
                            return CreateInvokeResponse(await OnSearchInvokeAsync(searchInvokeValue, turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case "adaptiveCard/action":
                            AdaptiveCardInvokeValue invokeValue = GetAdaptiveCardInvokeValue(turnContext.Activity);
                            return CreateInvokeResponse(await OnAdaptiveCardActionExecuteAsync(invokeValue, turnContext, turnState, cancellationToken).ConfigureAwait(false));

                        case SignInConstants.VerifyStateOperationName:
                        case SignInConstants.TokenExchangeOperationName:
                            await OnSignInInvokeAsync(turnContext, turnState, cancellationToken).ConfigureAwait(false);
                            return CreateInvokeResponse(null);

                        default:
                            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
                    }
                }
            }
            catch (InvokeResponseException e)
            {
                return new InvokeResponse
                {
                    Status = (int)e.StatusCode,
                    Body = e.Body
                };
            }
        }

        /// <summary>
        /// Invoked when a <c>signin/verifyState</c> or <c>signin/tokenExchange</c> event is received when the base behavior of
        /// <see cref="OnInvokeActivityAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/> is used.
        /// If using an <c>OAuthPrompt</c>, override this method to forward this <see cref="Activity"/> to the current dialog.
        /// By default, this method does nothing.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="OnInvokeActivityAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        /// method receives an Invoke with a <see cref="IInvokeActivity.Name"/> of `tokens/response`,
        /// it calls this method.
        ///
        /// If your bot uses the <c>OAuthPrompt</c>, forward the incoming <see cref="Activity"/> to
        /// the current dialog.
        /// </remarks>
        /// <seealso cref="OnInvokeActivityAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        protected virtual Task OnSignInInvokeAsync(ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            switch (turnContext.Activity.Name)
            {
                case SignInConstants.VerifyStateOperationName:
                    return OnSignInVerifyStateAsync(turnContext, turnState, cancellationToken);
                case SignInConstants.TokenExchangeOperationName:
                    return OnSignInTokenExchangeAsync(turnContext, turnState, cancellationToken);
                default:
                    break;
            }

            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when the bot is sent an Adaptive Card Action Execute.
        /// </summary>
        /// <param name="invokeValue">A strongly-typed object from the incoming activity's Value.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="OnInvokeActivityAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        /// method receives an Invoke with a <see cref="IInvokeActivity.Name"/> of `adaptiveCard/action`,
        /// it calls this method.
        /// </remarks>
        /// <seealso cref="OnInvokeActivityAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        protected virtual Task<AdaptiveCardInvokeResponse> OnAdaptiveCardActionExecuteAsync(AdaptiveCardInvokeValue invokeValue, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when the bot is sent an 'invoke' activity having name of 'application/search'.
        /// </summary>
        /// <param name="invokeValue">A strongly-typed object from the incoming activity's Value.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="OnInvokeActivityAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        /// method receives an Invoke with a <see cref="IInvokeActivity.Name"/> of `application/search`,
        /// it calls this method. The Activity.Value must be a well formed <see cref="SearchInvokeValue"/>.
        /// </remarks>
        /// <seealso cref="OnInvokeActivityAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        protected virtual Task<SearchInvokeResponse> OnSearchInvokeAsync(SearchInvokeValue invokeValue, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when an activity other than a message, conversation update, or event is received when the base behavior of
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// If overridden, this could potentially respond to any of the other activity types like
        /// <see cref="ActivityTypes.ContactRelationUpdate"/> or <see cref="ActivityTypes.EndOfConversation"/>.
        /// By default, this method does nothing.
        /// </summary>
        /// <param name="turnContext">The context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives an activity that is not a message, conversation update, message reaction,
        /// or event activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnMessageActivityAsync(ITurnContext{IMessageActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnConversationUpdateActivityAsync(ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnMessageReactionActivityAsync(ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnEventActivityAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// <seealso cref="Activity.Type"/>
        /// <seealso cref="ActivityTypes"/>
        protected virtual Task OnUnrecognizedActivityTypeAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        private static SearchInvokeValue GetSearchInvokeValue(IInvokeActivity activity)
        {
            if (activity.Value == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing value property for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            JObject? obj = activity.Value as JObject;
            if (obj == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            SearchInvokeValue? invokeValue;

            try
            {
                invokeValue = obj.ToObject<SearchInvokeValue>();
                if (invokeValue == null)
                {
                    throw new Exception();
                }
            }
            catch (Exception ex)
            {
                AdaptiveCardInvokeResponse errorResponse = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not valid for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, errorResponse, ex);
            }

            ValidateSearchInvokeValue(invokeValue, activity.ChannelId);
            return invokeValue;
        }

        private static void ValidateSearchInvokeValue(SearchInvokeValue searchInvokeValue, string channelId)
        {
            string? missingField = null;

            if (string.IsNullOrEmpty(searchInvokeValue.Kind))
            {
                // Teams does not always send the 'kind' field. Default to 'search'.
                if (Channels.Msteams.Equals(channelId, StringComparison.OrdinalIgnoreCase))
                {
                    searchInvokeValue.Kind = SearchInvokeTypes.Search;
                }
                else
                {
                    missingField = "kind";
                }
            }

            if (string.IsNullOrEmpty(searchInvokeValue.QueryText))
            {
                missingField = "queryText";
            }

            if (missingField != null)
            {
                AdaptiveCardInvokeResponse errorResponse = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", $"Missing {missingField} property for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, errorResponse);
            }
        }

        private static AdaptiveCardInvokeValue GetAdaptiveCardInvokeValue(IInvokeActivity activity)
        {
            if (activity.Value == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing value property");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            JObject? obj = activity.Value as JObject;
            if (obj == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            AdaptiveCardInvokeValue? invokeValue;

            try
            {
                invokeValue = obj.ToObject<AdaptiveCardInvokeValue>();
                if (invokeValue == null)
                {
                    throw new Exception();
                }
            }
            catch (Exception ex)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response, ex);
            }

            if (invokeValue.Action == null)
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing action property");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            if (invokeValue.Action.Type != "Action.Execute")
            {
                AdaptiveCardInvokeResponse response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "NotSupported", $"The action '{invokeValue.Action.Type}'is not supported.");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            return invokeValue;
        }

        private static AdaptiveCardInvokeResponse CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode statusCode, string code, string message)
        {
            return new AdaptiveCardInvokeResponse()
            {
                StatusCode = (int)statusCode,
                Type = "application/vnd.microsoft.error",
                Value = new Error()
                {
                    Code = code,
                    Message = message
                }
            };
        }


        /// <summary>
        /// Invoked when an card action invoke activity is received from the connector.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task<InvokeResponse> OnCardActionInvokeAsync(ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a signIn verify state activity is received from the connector.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnSignInVerifyStateAsync(ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a signIn token exchange activity is received from the connector.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnSignInTokenExchangeAsync(ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a file consent card activity is received from the connector.
        /// </summary>
        /// <param name="fileConsentCardResponse">The response representing the value of the invoke activity sent when the user acts on
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// a file consent card.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>An InvokeResponse depending on the action of the file consent card.</returns>
        protected virtual async Task<InvokeResponse> OnFileConsentAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            switch (fileConsentCardResponse.Action)
            {
                case "accept":
                    await OnFileConsentAcceptAsync(fileConsentCardResponse, turnContext, turnState, cancellationToken).ConfigureAwait(false);
                    return CreateInvokeResponse(null);

                case "decline":
                    await OnFileConsentDeclineAsync(fileConsentCardResponse, turnContext, turnState, cancellationToken).ConfigureAwait(false);
                    return CreateInvokeResponse(null);

                default:
                    throw new InvokeResponseException(HttpStatusCode.BadRequest, $"{fileConsentCardResponse.Action} is not a supported Action.");
            }
        }

        /// <summary>
        /// Invoked when a file consent card is accepted by the user.
        /// </summary>
        /// <param name="fileConsentCardResponse">The response representing the value of the invoke activity sent when the user accepts
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// a file consent card.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnFileConsentAcceptAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a file consent card is declined by the user.
        /// </summary>
        /// <param name="fileConsentCardResponse">The response representing the value of the invoke activity sent when the user declines
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// a file consent card.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnFileConsentDeclineAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a Messaging Extension Query activity is received from the connector.
        /// </summary>
        /// <param name="query">The query for the search command.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Response for the query.</returns>
        protected virtual Task<MessagingExtensionResponse> OnMessagingExtensionQueryAsync(MessagingExtensionQuery query, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a O365 Connector Card Action activity is received from the connector.
        /// </summary>
        /// <param name="query">The O365 connector card HttpPOST invoke query.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnO365ConnectorCardActionAsync(O365ConnectorCardActionQuery query, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when an app based link query activity is received from the connector.
        /// </summary>
        /// <param name="query">The invoke request body type for app-based link query.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Response for the query.</returns>
        protected virtual Task<MessagingExtensionResponse> OnAppBasedLinkQueryAsync(AppBasedLinkQuery query, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when an anonymous app based link query activity is received from the connector.
        /// </summary>
        /// <param name="query">The invoke request body type for app-based link query.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Response for the query.</returns>
        protected virtual Task<MessagingExtensionResponse> OnAnonymousAppBasedLinkQueryAsync(AppBasedLinkQuery query, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a messaging extension select item activity is received from the connector.
        /// </summary>
        /// <param name="query">The object representing the query.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Response for the query.</returns>
        protected virtual Task<MessagingExtensionResponse> OnMessagingExtensionSelectItemAsync(JObject query, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a Messaging Extension Fetch activity is received from the connector.
        /// </summary>
        /// <param name="action">The messaging extension action.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Action Response for the action.</returns>
        protected virtual Task<MessagingExtensionActionResponse> OnMessagingExtensionFetchTaskAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a messaging extension submit action dispatch activity is received from the connector.
        /// </summary>
        /// <param name="action">The messaging extension action.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Action Response for the action.</returns>
        protected virtual async Task<MessagingExtensionActionResponse> OnMessagingExtensionSubmitActionDispatchAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            if (!string.IsNullOrEmpty(action.BotMessagePreviewAction))
            {
                switch (action.BotMessagePreviewAction)
                {
                    case "edit":
                        return await OnMessagingExtensionBotMessagePreviewEditAsync(action, turnContext, turnState, cancellationToken).ConfigureAwait(false);

                    case "send":
                        return await OnMessagingExtensionBotMessagePreviewSendAsync(action, turnContext, turnState, cancellationToken).ConfigureAwait(false);

                    default:
                        throw new InvokeResponseException(HttpStatusCode.BadRequest, $"{action.BotMessagePreviewAction} is not a supported BotMessagePreviewAction.");
                }
            }
            else
            {
                return await OnMessagingExtensionSubmitActionAsync(action, turnContext, turnState, cancellationToken).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Invoked when a messaging extension submit action activity is received from the connector.
        /// </summary>
        /// <param name="action">The messaging extension action.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Action Response for the action.</returns>
        protected virtual Task<MessagingExtensionActionResponse> OnMessagingExtensionSubmitActionAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a messaging extension bot message preview edit activity is received from the connector.
        /// </summary>
        /// <param name="action">The messaging extension action.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Action Response for the action.</returns>
        protected virtual Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewEditAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a messaging extension bot message preview send activity is received from the connector.
        /// </summary>
        /// <param name="action">The messaging extension action.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Action Response for the action.</returns>
        protected virtual Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewSendAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Invoked when a messaging extension configuration query setting url activity is received from the connector.
        /// </summary>
        /// <param name="query">The Messaging extension query.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Messaging Extension Response for the query.</returns>
        protected virtual Task<MessagingExtensionResponse> OnMessagingExtensionConfigurationQuerySettingUrlAsync(MessagingExtensionQuery query, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when a configuration is set for a messaging extension.
        /// </summary>
        /// <param name="settings">Object representing the configuration settings.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMessagingExtensionConfigurationSettingAsync(JObject settings, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when a card button is clicked in a messaging extension.
        /// </summary>
        /// <param name="cardData">Object representing the card data.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMessagingExtensionCardButtonClickedAsync(JObject cardData, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when a task module is fetched.
        /// </summary>
        /// <param name="taskModuleRequest">The task module invoke request value payload.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A Task Module Response for the request.</returns>
        protected virtual Task<TaskModuleResponse> OnTaskModuleFetchAsync(TaskModuleRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when a task module is submited.
        /// </summary>
        /// <param name="taskModuleRequest">The task module invoke request value payload.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A Task Module Response for the request.</returns>
        protected virtual Task<TaskModuleResponse> OnTaskModuleSubmitAsync(TaskModuleRequest taskModuleRequest, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when a tab is fetched.
        /// </summary>
        /// <param name="tabRequest">The tab invoke request value payload.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A Tab Response for the request.</returns>
        protected virtual Task<TabResponse> OnTabFetchAsync(TabRequest tabRequest, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Override this in a derived class to provide logic for when a tab is submitted.
        /// </summary>
        /// <param name="tabSubmit">The tab submit invoke request value payload.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A Tab Response for the request.</returns>
        protected virtual Task<TabResponse> OnTabSubmitAsync(TabSubmit tabSubmit, ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new InvokeResponseException(HttpStatusCode.NotImplemented);
        }

        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.EndOfConversation"/> activities, such as the conversational logic.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnEndOfConversationActivityAsync(ITurnContext<IEndOfConversationActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }


        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.Typing"/> activities, such as the conversational logic.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnTypingActivityAsync(ITurnContext<ITypingActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.InstallationUpdate"/> activities.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a installation update activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnInstallationUpdateActivityAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            switch (turnContext.Activity.Action)
            {
                case InstallationUpdateActionTypes.Add:
                case "add-upgrade":
                    return OnInstallationUpdateAddAsync(turnContext, turnState, cancellationToken);
                case InstallationUpdateActionTypes.Remove:
                case "remove-upgrade":
                    return OnInstallationUpdateRemoveAsync(turnContext, turnState, cancellationToken);
                default:
                    throw new NotImplementedException();
            }
        }

        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.InstallationUpdate"/> activities with 'action' set to 'add'.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a installation update activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnInstallationUpdateAddAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.InstallationUpdate"/> activities with 'action' set to 'remove'.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a installation update activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnInstallationUpdateRemoveAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a command activity is received when the base behavior of
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// Commands are requests to perform an action and receivers typically respond with
        /// one or more commandResult activities. Receivers are also expected to explicitly
        /// reject unsupported command activities.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a command activity, it calls this method.
        ///
        /// In a derived class, override this method to add logic that applies to all comand activities.
        /// Add logic to apply before the specific command-handling logic before the call to the base class
        /// <see cref="OnCommandActivityAsync(ITurnContext{ICommandActivity}, TState, CancellationToken)"/> method.
        /// Add logic to apply after the specific command-handling logic after the call to the base class
        /// <see cref="OnCommandActivityAsync(ITurnContext{ICommandActivity}, TState, CancellationToken)"/> method.
        ///
        /// Command activities communicate programmatic information from a client or channel to a bot.
        /// The meaning of an command activity is defined by the <see cref="ICommandActivity.Name"/> property,
        /// which is meaningful within the scope of a channel.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnCommandActivityAsync(ITurnContext{ICommandActivity}, TState, CancellationToken)"/>
        protected virtual Task OnCommandActivityAsync(ITurnContext<ICommandActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a CommandResult activity is received when the base behavior of
        /// <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// CommandResult activities can be used to communicate the result of a command execution.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a CommandResult activity, it calls this method.
        ///
        /// In a derived class, override this method to add logic that applies to all comand activities.
        /// Add logic to apply before the specific CommandResult-handling logic before the call to the base class
        /// <see cref="OnCommandResultActivityAsync(ITurnContext{ICommandResultActivity}, TState, CancellationToken)"/> method.
        /// Add logic to apply after the specific CommandResult-handling logic after the call to the base class
        /// <see cref="OnCommandResultActivityAsync(ITurnContext{ICommandResultActivity}, TState, CancellationToken)"/> method.
        ///
        /// CommandResult activities communicate programmatic information from a client or channel to a bot.
        /// The meaning of an CommandResult activity is defined by the <see cref="ICommandResultActivity.Name"/> property,
        /// which is meaningful within the scope of a channel.
        /// </remarks>
        /// <seealso cref="RunActivityHandlerAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnCommandResultActivityAsync(ITurnContext{ICommandResultActivity}, TState, CancellationToken)"/>
        protected virtual Task OnCommandResultActivityAsync(ITurnContext<ICommandResultActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Teams Meeting Start event activity is received from the connector.
        /// Override this in a derived class to provide logic for when a meeting is started.
        /// </summary>
        /// <param name="meeting">The details of the meeting.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMeetingStartAsync(MeetingStartEventDetails meeting, ITurnContext<IEventActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a Teams Meeting End event activity is received from the connector.
        /// Override this in a derived class to provide logic for when a meeting is ended.
        /// </summary>
        /// <param name="meeting">The details of the meeting.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnMeetingEndAsync(MeetingEndEventDetails meeting, ITurnContext<IEventActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a read receipt for a previously sent message is received from the connector.
        /// Override this in a derived class to provide logic for when the bot receives a read receipt event.
        /// </summary>
        /// <param name="readReceiptInfo">Information regarding the read receipt. i.e. Id of the message last read by the user.</param>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        protected virtual Task OnReadReceiptAsync(ReadReceiptInfo readReceiptInfo, ITurnContext<IEventActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Convert original handler to proactive conversation.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="handler">The method to call to handle the bot turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        private Task _StartLongRunningCall(ITurnContext turnContext, Func<ITurnContext, CancellationToken, Task> handler, CancellationToken cancellationToken = default)
        {
            if (ActivityTypes.Message.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase) && Options.LongRunningMessages == true)
            {
                /// <see cref="BotAdapter.ContinueConversationAsync"/> supports <see cref="Activity"/> as input
                return Options.Adapter!.ContinueConversationAsync(Options.BotAppId, turnContext.Activity, (context, ct) => handler(context, ct), cancellationToken);
            }
            else
            {
                return handler(turnContext, cancellationToken);
            }
        }

        /// <summary>
        /// Safely casts an object to an object of type <typeparamref name="T"/> .
        /// </summary>
        /// <param name="value">The object to be casted.</param>
        /// <returns>The object casted in the new type.</returns>
        private static T SafeCast<T>(object value)
        {
            JObject? obj = value as JObject;
            T? result;
            if (obj == null || (result = obj.ToObject<T>()) == null)
            {
                throw new InvokeResponseException(HttpStatusCode.BadRequest, $"expected type '{value.GetType().Name}'");
            }

            return result;
        }
    }
}
