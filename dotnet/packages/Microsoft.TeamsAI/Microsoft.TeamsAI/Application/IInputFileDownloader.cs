using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Application
{
    /// <summary>
    /// A plugin responsible for downloading files relative to the current user's input.
    /// </summary>
    /// <typeparam name="TState">Type of application state.</typeparam>
    public interface IInputFileDownloader<TState> where TState : TurnState, new()
    {
        /// <summary>
        /// Download any files relative to the current user's input.
        /// </summary>
        /// <param name="turnContext">The turn context.</param>
        /// <param name="turnState">The turn state.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>A list of input files</returns>
        public Task<List<InputFile>> DownloadFilesAsync(ITurnContext turnContext, TState turnState, CancellationToken cancellationToken = default);
    }
}
