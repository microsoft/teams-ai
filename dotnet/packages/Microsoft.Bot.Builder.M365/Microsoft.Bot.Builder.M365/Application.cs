using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using System.Net;
using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Bot.Builder.Integration.AspNet.Core;

namespace Microsoft.Bot.Builder.M365
{
    public class Application<TState> : IBot where TState : TurnState
    {
        private readonly ApplicationOptions<TState> _options;
        private readonly AI<TState>? _ai;

        public Application(ApplicationOptions<TState> options)
        {
            _options = options;

            if (_options.TurnStateManager == null)
            {
                // TODO: set to default turn state manager
                _options.TurnStateManager = null;
            }

            if (_options.AI == null)
            {
                // TODO: set to default AI object
                _ai = null;
            }

        }

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

        public ApplicationOptions<TState> Options { get { return _options; } }

        /// <summary>
        /// Handler that will execute before the turn's activity handler logic is processed.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>True to continue execution of the current turn. Otherwise, return False.</returns>
        protected virtual Task<bool> OnBeforeTurnAsync (ITurnContext turnContext, TState turnState, CancellationToken cancellationToken)
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
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is responsible for
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

            TypingTimer? timer = null;

            try
            {
                // Start typing timer if configured
                if (_options.StartTypingTimer)
                {
                    timer = new TypingTimer(_options.TypingTimerDelay);
                    timer.StartTypingTimer(turnContext);
                }

                // Remove @mentions
                if (_options.RemoveRecipientMention && ActivityTypes.Message.Equals(turnContext.Activity.Type, StringComparison.OrdinalIgnoreCase))
                {
                    turnContext.Activity.Text = turnContext.Activity.RemoveRecipientMention();
                }

                // TODO : Fix turn state loading, this is just a placeholder
                TState turnState = (TState)new TurnState();

                // Call before activity handler
                if (!await OnBeforeTurnAsync(turnContext, turnState, cancellationToken)) return;

                // Call activity type specific handler
                bool eventHandlerCalled = await RunAsync(turnContext, turnState, cancellationToken);

                if (!eventHandlerCalled)
                {
                    // TODO : call AI module
                }

                // Call after activity handler
                if (await OnAfterTurnAsync(turnContext, turnState, cancellationToken))
                {
                    // TODO : Save turn state to persistent storage
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
        /// <returns>True if and only if the executed handler method was implemented.</returns>
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
        public async Task<bool> RunAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken)
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
                        var invokeResponse = await OnInvokeActivityAsync(new DelegatingTurnContext<IInvokeActivity>(turnContext), turnState, cancellationToken).ConfigureAwait(false);

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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message update activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnMessageUpdateActivityAsync(ITurnContext<IMessageUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message delete activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnMessageDeleteActivityAsync(ITurnContext<IMessageDeleteActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a conversation update activity is received from the channel when the base behavior of
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is used.
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnMembersAddedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnMembersRemovedAsync(IList{ChannelAccount}, ITurnContext{IConversationUpdateActivity}, TState, CancellationToken)"/>
        protected virtual Task OnConversationUpdateActivityAsync(ITurnContext<IConversationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
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
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is used.
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnReactionsAddedAsync(IList{MessageReaction}, ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnReactionsRemovedAsync(IList{MessageReaction}, ITurnContext{IMessageReactionActivity}, TState, CancellationToken)"/>
        protected virtual async Task OnMessageReactionActivityAsync(ITurnContext<IMessageReactionActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            if (turnContext.Activity.ReactionsAdded != null)
            {
                await OnReactionsAddedAsync(turnContext.Activity.ReactionsAdded, turnContext, turnState, cancellationToken).ConfigureAwait(false);
            }

            if (turnContext.Activity.ReactionsRemoved != null)
            {
                await OnReactionsRemovedAsync(turnContext.Activity.ReactionsRemoved, turnContext, turnState, cancellationToken).ConfigureAwait(false);
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
        protected virtual Task OnReactionsAddedAsync(IList<MessageReaction> messageReactions, ITurnContext<IMessageReactionActivity> turnContext, TState turnState,  CancellationToken cancellationToken)
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
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is used.
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnTokenResponseEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        /// <seealso cref="OnEventAsync(ITurnContext{IEventActivity}, TState, CancellationToken)"/>
        protected virtual Task OnEventActivityAsync(ITurnContext<IEventActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
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
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is used.
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives an invoke activity, it calls this method.
        /// If the event <see cref="IInvokeActivity.Name"/> is `signin/verifyState` or `signin/tokenExchange`, it calls
        /// <see cref="OnSignInInvokeAsync(ITurnContext{IInvokeActivity}, TState, CancellationToken)"/>
        /// Invoke activities communicate programmatic commands from a client or channel to a bot.
        /// The meaning of an invoke activity is defined by the <see cref="IInvokeActivity.Name"/> property,
        /// which is meaningful within the scope of a channel.
        /// A `signin/verifyState` or `signin/tokenExchange` invoke can be triggered by an <see cref="OAuthCard"/> or an OAuth prompt.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual async Task<InvokeResponse> OnInvokeActivityAsync(ITurnContext<IInvokeActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            try
            {
                switch (turnContext.Activity.Name)
                {
                    case "application/search":
                        var searchInvokeValue = GetSearchInvokeValue(turnContext.Activity);
                        return CreateInvokeResponse(await OnSearchInvokeAsync(searchInvokeValue, turnContext, turnState, cancellationToken).ConfigureAwait(false));

                    case "adaptiveCard/action":
                        var invokeValue = GetAdaptiveCardInvokeValue(turnContext.Activity);
                        return CreateInvokeResponse(await OnAdaptiveCardActionExecuteAsync(invokeValue, turnContext, turnState, cancellationToken).ConfigureAwait(false));

                    case SignInConstants.VerifyStateOperationName:
                    case SignInConstants.TokenExchangeOperationName:
                        await OnSignInInvokeAsync(turnContext, turnState, cancellationToken).ConfigureAwait(false);
                        return CreateInvokeResponse(null);

                    default:
                        throw new InvokeResponseException(HttpStatusCode.NotImplemented);
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
        /// Override this in a derived class to provide logic specific to
        /// <see cref="ActivityTypes.EndOfConversation"/> activities, such as the conversational logic.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a message activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a installation update activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a installation update activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives a installation update activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        protected virtual Task OnInstallationUpdateRemoveAsync(ITurnContext<IInstallationUpdateActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a command activity is received when the base behavior of
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is used.
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnCommandActivityAsync(ITurnContext{ICommandActivity}, TState, CancellationToken)"/>
        protected virtual Task OnCommandActivityAsync(ITurnContext<ICommandActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when a CommandResult activity is received when the base behavior of
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is used.
        /// CommandResult activities can be used to communicate the result of a command execution.
        /// </summary>
        /// <param name="turnContext">A strongly-typed context object for this turn.</param>
        /// <param name="turnState">The turn state object that stores arbitrary data for this turn.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>A task that represents the work queued to execute.</returns>
        /// <remarks>
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// <seealso cref="OnCommandResultActivityAsync(ITurnContext{ICommandResultActivity}, TState, CancellationToken)"/>
        protected virtual Task OnCommandResultActivityAsync(ITurnContext<ICommandResultActivity> turnContext, TState turnState, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Invoked when an activity other than a message, conversation update, or event is received when the base behavior of
        /// <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/> is used.
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
        /// When the <see cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
        /// method receives an activity that is not a message, conversation update, message reaction,
        /// or event activity, it calls this method.
        /// </remarks>
        /// <seealso cref="RunAsync(ITurnContext, TState, CancellationToken)"/>
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
                var response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing value property for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            var obj = activity.Value as JObject;
            if (obj == null)
            {
                var response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            SearchInvokeValue? invokeValue;

            try
            {
                invokeValue = obj.ToObject<SearchInvokeValue>();
                if (invokeValue == null) throw new Exception();
            }
            catch (Exception ex)
            {
                var errorResponse = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not valid for search");
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
                if (Connector.Channels.Msteams.Equals(channelId, StringComparison.OrdinalIgnoreCase))
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
                var errorResponse = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", $"Missing {missingField} property for search");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, errorResponse);
            }
        }

        private static AdaptiveCardInvokeValue GetAdaptiveCardInvokeValue(IInvokeActivity activity)
        {
            if (activity.Value == null)
            {
                var response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing value property");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            var obj = activity.Value as JObject;
            if (obj == null)
            {
                var response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            AdaptiveCardInvokeValue? invokeValue;

            try
            {
                invokeValue = obj.ToObject<AdaptiveCardInvokeValue>();
                if (invokeValue == null) throw new Exception();
            }
            catch (Exception ex)
            {
                var response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Value property is not properly formed");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response, ex);
            }

            if (invokeValue.Action == null)
            {
                var response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "BadRequest", "Missing action property");
                throw new InvokeResponseException(HttpStatusCode.BadRequest, response);
            }

            if (invokeValue.Action.Type != "Action.Execute")
            {
                var response = CreateAdaptiveCardInvokeErrorResponse(HttpStatusCode.BadRequest, "NotSupported", $"The action '{invokeValue.Action.Type}'is not supported.");
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
    }

}