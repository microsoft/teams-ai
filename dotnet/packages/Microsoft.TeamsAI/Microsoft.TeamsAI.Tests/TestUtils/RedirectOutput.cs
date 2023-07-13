using Microsoft.Extensions.Logging;
using System.Text;
using Xunit.Abstractions;

public class RedirectOutput : TextWriter, ILogger
{
    private readonly StringBuilder _log;
    private readonly ITestOutputHelper _output;

    public override Encoding Encoding => Encoding.UTF8;

    public RedirectOutput(ITestOutputHelper output)
    {
        _output = output;
        _log = new StringBuilder();
    }

    public override void WriteLine(string? message)
    {
        _output.WriteLine(message);
        _log.AppendLine(message);
    }

    public string GetLogs()
    {
        return _log.ToString();
    }

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        var message = formatter(state, exception);

        _output?.WriteLine(message);
        _log.AppendLine(message);
    }

    public bool IsEnabled(LogLevel logLevel)
    {
        return true;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull
    {
        return null;
    }
}