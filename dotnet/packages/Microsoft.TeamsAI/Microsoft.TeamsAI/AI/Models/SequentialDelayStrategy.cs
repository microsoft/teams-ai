using Azure;
using Azure.Core;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// A customized delay strategy that uses a fixed sequence of delays that are iterated through as the number of retries increases.
    /// </summary>
    internal class SequentialDelayStrategy : DelayStrategy
    {
        private List<TimeSpan> _delays;

        public SequentialDelayStrategy(List<TimeSpan> delays)
        {
            this._delays = delays;
        }

        protected override TimeSpan GetNextDelayCore(Response? response, int retryNumber)
        {
            int index = retryNumber - 1;
            return index >= _delays.Count ? _delays[_delays.Count - 1] : _delays[index];
        }
    }
}
