// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class SimpleAdapter : BotAdapter
    {
        private readonly Action<Activity[]>? _callOnSend;
        private readonly Action<Activity>? _callOnUpdate;
        private readonly Action<ConversationReference>? _callOnDelete;

        public SimpleAdapter()
        {
        }

        public SimpleAdapter(Action<Activity[]> callOnSend)
        {
            _callOnSend = callOnSend;
        }

        public SimpleAdapter(Action<Activity> callOnUpdate)
        {
            _callOnUpdate = callOnUpdate;
        }

        public SimpleAdapter(Action<ConversationReference> callOnDelete)
        {
            _callOnDelete = callOnDelete;
        }

        public override Task DeleteActivityAsync(ITurnContext turnContext, ConversationReference reference, CancellationToken cancellationToken)
        {
            Assert.NotNull(reference); // SimpleAdapter.deleteActivity: missing reference
            _callOnDelete?.Invoke(reference);
            return Task.CompletedTask;
        }

        public override Task<ResourceResponse[]> SendActivitiesAsync(ITurnContext turnContext, Activity[] activities, CancellationToken cancellationToken)
        {
            Assert.NotNull(activities); // SimpleAdapter.deleteActivity: missing reference
            Assert.True(activities.Count() > 0, "SimpleAdapter.sendActivities: empty activities array.");

            _callOnSend?.Invoke(activities);
            List<ResourceResponse> responses = new();
            responses.AddRange(activities.Select(activity => new ResourceResponse(activity.Id)));
            return Task.FromResult(responses.ToArray());
        }

        public override Task<ResourceResponse> UpdateActivityAsync(ITurnContext turnContext, Activity activity, CancellationToken cancellationToken)
        {
            Assert.NotNull(activity); //SimpleAdapter.updateActivity: missing activity
            _callOnUpdate?.Invoke(activity);
#pragma warning disable CA1062 // Validate arguments of public methods
            return Task.FromResult(new ResourceResponse(activity.Id)); // echo back the Id
#pragma warning restore CA1062 // Validate arguments of public methods
        }

        public async Task ProcessRequest(Activity activity, BotCallbackHandler callback, CancellationToken cancellationToken)
        {
            using (var ctx = new TurnContext(this, activity))
            {
                await RunPipelineAsync(ctx, callback, cancellationToken);
            }
        }
    }
}
