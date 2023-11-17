using Azure;
using Azure.Core;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// A configured delay strategy to support the `RetryPolicy` defined in <see cref="BaseOpenAIModelOptions"/>.
    /// </summary>
    internal class ConfiguredDelayStrategy : DelayStrategy
    {
        private List<int> _delays;

        public ConfiguredDelayStrategy(List<int> delays)
        {
            this._delays = delays;
        }

        protected override TimeSpan GetNextDelayCore(Response? response, int retryNumber)
        {
            int sum = 0;
            for (int i = 0; i < retryNumber; i++)
            {
                sum += _delays[i];
            }
            return Max(TimeSpan.Zero, TimeSpan.FromMilliseconds(_delays[retryNumber] - sum));
        }
    }
}
