using Microsoft.Teams.AI.Utilities;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Encapsulates the logic for sending "typing" activity to the user.
    /// </summary>
    internal class TypingTimer : IDisposable
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
            Verify.ParamNotNull(turnContext);

            if (turnContext.Activity.Type != ActivityTypes.Message || IsRunning())
            {
                return false;
            }

            // Listen for outgoing activities
            turnContext.OnSendActivities(StopTimerWhenSendMessageActivityHandler);

            // Start periodically send "typing" activity
            _timer = new Timer(SendTypingActivity, turnContext, Timeout.Infinite, Timeout.Infinite);

            // Fire first time
            _timer.Change(0, Timeout.Infinite);

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
            ITurnContext turnContext = state as ITurnContext ?? throw new ArgumentException("Unexpected failure of casting object TurnContext");

            try
            {
                await turnContext.SendActivityAsync(new Activity { Type = ActivityTypes.Typing });
                if (IsRunning())
                {
                    _timer?.Change(_interval, Timeout.Infinite);
                }
            }
            catch (Exception e) when (e is ObjectDisposedException || e is TaskCanceledException || e is NullReferenceException)
            {
                // We're in the middle of sending an activity on a background thread when the turn ends and
                // the turn context object is disposed of or the request is cancelled. We can just eat the
                // error but lets make sure our states cleaned up a bit.
                Dispose();
            }
        }

        private Task<ResourceResponse[]> StopTimerWhenSendMessageActivityHandler(ITurnContext turnContext, List<Activity> activities, Func<Task<ResourceResponse[]>> next)
        {
            if (_timer != null)
            {
                foreach (Activity activity in activities)
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
    }
}
