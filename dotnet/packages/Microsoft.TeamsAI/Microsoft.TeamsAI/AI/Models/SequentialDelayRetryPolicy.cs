using System.ClientModel.Primitives;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// A customized delay retry policy that uses a fixed sequence of delays that are iterated through as the number of retries increases.
    /// </summary>
    internal class SequentialDelayRetryPolicy : ClientRetryPolicy
    {
        private List<TimeSpan> _delays;

        public SequentialDelayRetryPolicy(List<TimeSpan> delays, int maxRetries = 3) : base(maxRetries)
        {
            this._delays = delays;
        }

        protected override TimeSpan GetNextDelay(PipelineMessage message, int tryCount)
        {
            int index = tryCount - 1;
            return index >= _delays.Count ? _delays[_delays.Count - 1] : _delays[index];
        }
    }
}
