using static Microsoft.Teams.AI.AI.Models.IPromptCompletionModelEvents;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Emitter class that handles the subscription of streaming events.
    /// </summary>
    public class PromptCompletionModelEmitter
    {
        /// <summary>
        /// Triggered before the model is called to complete a prompt.
        /// </summary>
        public event BeforeCompletionHandler? BeforeCompletion;

        /// <summary>
        /// Triggered when a chunk is received from the model via streaming.
        /// </summary>
        public event ChunkReceivedHandler? ChunkReceived;

        /// <summary>
        /// Triggered after the model finishes returning a response.
        /// </summary>
        public event ResponseReceivedHandler? ResponseReceived;

        /// <summary>
        /// Invokes the BeforeCompletionHandler.
        /// </summary>
        /// <param name="args"></param>
        public virtual void OnBeforeCompletion(BeforeCompletionEventArgs args)
        {
            BeforeCompletion?.Invoke(this, args);
        }

        /// <summary>
        /// Invokes the ChunkReceivedHandler.
        /// </summary>
        /// <param name="args"></param>
        public virtual void OnChunkReceived(ChunkReceivedEventArgs args)
        {
            ChunkReceived?.Invoke(this, args);
        }

        /// <summary>
        /// Invokes the ResponseReceivedHandler.
        /// </summary>
        /// <param name="args"></param>
        public virtual void OnResponseReceived(ResponseReceivedEventArgs args)
        {
            ResponseReceived?.Invoke(this, args);
        }
    }
}
