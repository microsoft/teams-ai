using Microsoft.Bot.Schema;

namespace Microsoft.Bot.Builder.M365
{
    /// <summary>
    /// Encapsulates the logic for sending "typing" activity to the user.
    /// </summary>
    public class TypingTimer : IDisposable
    {
        private Timer? _timer;
        /// <summary>
        /// The interval in milliseconds to send "typing" activity.
        /// </summary>
        private readonly int _interval;

        /// <summary>
        /// To detect redundant calls
        /// </summary>
        private bool _disposedValue = false;

        /// <summary>
        /// Data passed to the timer callback.
        /// </summary>
        private TimerState? _timerState;

        /// <summary>
        /// Constructs a new instance of the <see cref="TypingTimer"/> class.
        /// </summary>
        /// <param name="interval">The interval in milliseconds to send "typing" activity.</param>
        public TypingTimer(int interval = 1000)
        {
            _interval = interval;
        }

        /// <summary>
        /// Manually start a timer to periodically send "typing" activity.
        /// </summary>
        /// <remarks>
        /// The timer will automatically end once an outgoing activity has been sent. If the timer is already running or 
        /// the current activity is not a "message" the call is ignored.
        /// </remarks>
        /// <param name="turnContext">The context for the current turn with the user.</param>
        /// <returns>True if the timer was started, otherwise False.</returns>
        public bool Start(ITurnContext turnContext)
        {
            if (turnContext.Activity.Type != ActivityTypes.Message || IsRunning()) return false;

            _timerState = new TimerState(turnContext, false);

            // Listen for outgoing activities
            turnContext.OnSendActivities(StopTimerWhenSendMessageActivityHandler);

            // Start periodically send "typing" activity
            _timer = new Timer(SendTypingActivity, _timerState, 0, _interval);

            return true;
        }

        /// <summary>
        /// Stop the timer that periodically sends "typing" activity.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        public virtual void Dispose(bool disposing)
        {
            if (!_disposedValue)
            {
                if (disposing)
                {
                    if (_timer != null)
                    {
                        _timer.Dispose();
                        _timer = null;
                        _timerState = null;
                    }
                }

                _disposedValue = true;
            }
        }

        /// <summary>
        /// Whether there is a timer currently running.
        /// </summary>
        /// <returns>True if there's a timer currently running, otherwise False.</returns>
        public bool IsRunning()
        {
            return _timer != null;
        }

        private async void SendTypingActivity(object state)
        {
            TimerState timerState = state as TimerState ?? throw new Exception("Unexpected failure of casting object TimerState");

            ITurnContext turnContext = timerState.TurnContext;

            try
            {
                if (timerState.SendInProgress == false)
                {
                    timerState.SendInProgress = true;
                    await turnContext.SendActivityAsync(new Activity { Type = ActivityTypes.Typing });
                    timerState.SendInProgress = false;
                }
                else
                {
                    // If the previous task is still running, we don't need to start a new one.
                    // This is to avoid sending multiple "typing" activities at the same time.
                    // (e.g. when the bot is slow to respond to user input)
                    return;
                }
            } 
            catch (ObjectDisposedException)
            {
                // We're in the middle of sending an activity on a background thread when the turn ends and
                // the turn context object is dispoed of. We can just eat the error but lets
                // make sure our states cleaned up a bit.
                Dispose();
            }
        }

        private Task<ResourceResponse[]> StopTimerWhenSendMessageActivityHandler(ITurnContext turnContext, List<Activity> activities, Func<Task<ResourceResponse[]>> next)
        {
            if (_timer != null)
            {
                foreach (var activity in activities)
                {
                    if (activity.Type == ActivityTypes.Message)
                    {
                        Dispose();
                        break;
                    }
                }
            }

            return next();
        }

        private class TimerState
        {
            public readonly ITurnContext TurnContext;
            public bool SendInProgress;

            public TimerState(ITurnContext turnContext, bool typingActivitySendInProgress) 
            {
                TurnContext = turnContext;
                SendInProgress = typingActivitySendInProgress;
            }

        }
    }
}