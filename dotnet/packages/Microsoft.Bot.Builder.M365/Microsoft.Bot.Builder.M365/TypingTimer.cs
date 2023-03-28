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
        private int _interval;

        public TypingTimer(int typingTimerDelay)
        {
            this._interval = typingTimerDelay;
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
            if (turnContext.Activity.Type != ActivityTypes.Message || this.timer != null) return;

            // Listen for outgoing activities
            turnContext.OnSendActivities(StopTimerWhenSendMessageActivityHandler);
            
            // Start periodically send "typing" activity
            this.timer = new Timer(SendTypingActivity, turnContext, 0, _interval);
        }

        public void StopTypingTimer()
        {
            if (this.timer == null) return;
            
            this.timer.Dispose();
            this.timer = null;
        }

        private async void SendTypingActivity(object state)
        {
            ITurnContext? turnContext = state as TurnContext;
                
            if (turnContext == null)
            {
                throw new Exception("Unexpected failure of casting object TurnContext");
            }

            try
            {
                await turnContext.SendActivityAsync(new Activity { Type = ActivityTypes.Typing });
            } 
            catch (Exception)
            {
                // Seeing a random proxy violation error from the context object. This is because
                // we're in the middle of sending an activity on a background thread when the turn ends.
                // The context object throws when we try to update "this.Responded = true". We can just
                // eat the error but lets make sure our states cleaned up a bit.
                this.timer = null;

            }
        }


        private Task<ResourceResponse[]> StopTimerWhenSendMessageActivityHandler(ITurnContext turnContext, List<Activity> activities, Func<Task<ResourceResponse[]>> next)
        {
            if (this.timer != null)
            {
                foreach (var activity in activities)
                {
                    if (activity.Type == ActivityTypes.Message)
                    {
                        this.StopTypingTimer();
                        break;
                    }
                }
            }

            return next();
        }

    }
}
