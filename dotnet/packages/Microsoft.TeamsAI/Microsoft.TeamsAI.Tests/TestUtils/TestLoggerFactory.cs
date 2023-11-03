using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal sealed class TestLoggerFactory : ILoggerFactory
    {
        private readonly ILogger _loggerInstance;

        public TestLoggerFactory(ILogger? loggerInstance = null)
        {
            _loggerInstance = loggerInstance is null ? NullLogger.Instance : loggerInstance;
        }

        public void AddProvider(ILoggerProvider provider)
        {
        }

        public ILogger CreateLogger(string categoryName)
        {
            return _loggerInstance;
        }

        public void Dispose()
        {
        }
    }
}
