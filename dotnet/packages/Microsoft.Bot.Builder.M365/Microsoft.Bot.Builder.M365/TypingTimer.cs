using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Net;
using System.Runtime.CompilerServices;
using System.Text;

namespace Microsoft.Bot.Builder.M365
{
    /// <summary>
    /// Encapsulates the logic for sending "typing" activity to the user.
    /// </summary>
    public class TypingTimer
    {
        public Timer? timer;
        /// <summary>
        /// The interval in milliseconds to send "typing" activity.
        /// </summary>
        private readonly int _interval;

        /// <summary>
        /// Constructs a new instance of the <see cref="TypingTimer"/> class.
        /// </summary>
        /// <param name="interval">The interval in milliseconds to send "typing" activity.</param>
        public TypingTimer(int interval)
        {
            this._interval = interval;
        }

        /// <summary>
        /// Manually start a timer to periodically send "typing" activity.
        /// </summary>
        /// <remarks>
        /// The timer will automatically end once an outgoing activity has been sent. If the timer is already running or 
        /// the current activity is not a "message" the call is ignored.
        /// </remarks>
        /// <param name="turnContext">The context for the current turn with the user.</param>
        public void StartTypingTimer(ITurnContext turnContext)
        {
            if (turnContext.Activity.Type != ActivityTypes.Message || timer != null) return;

            // Listen for outgoing activities
            turnContext.OnSendActivities(StopTimerWhenSendMessageActivityHandler);
            
            // Start periodically send "typing" activity
            timer = new Timer(SendTypingActivity, turnContext, 0, _interval);
        }

        public void StopTypingTimer()
        {
            if (timer == null) return;
            
            timer.Dispose();
            timer = null;
        }

        private async void SendTypingActivity(object state)
        {
            ITurnContext turnContext = state as TurnContext ?? throw new Exception("Unexpected failure of casting object TurnContext");

            try
            {
                await turnContext.SendActivityAsync(new Activity { Type = ActivityTypes.Typing });
            } 
            catch (ObjectDisposedException)
            {
                // We're in the middle of sending an activity on a background thread when the turn ends and
                // the turn context object is dispoed of. We can just eat the error but lets
                // make sure our states cleaned up a bit.
                timer = null;

            }
        }


        private Task<ResourceResponse[]> StopTimerWhenSendMessageActivityHandler(ITurnContext turnContext, List<Activity> activities, Func<Task<ResourceResponse[]>> next)
        {
            if (timer != null)
            {
                foreach (var activity in activities)
                {
                    if (activity.Type == ActivityTypes.Message)
                    {
                        StopTypingTimer();
                        break;
                    }
                }
            }

            return next();
        }

    }
}
