using System.ClientModel.Primitives;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Helper class to inject headers into HTTP pipeline.
    /// </summary>
    internal class AddHeaderRequestPolicy : PipelinePolicy
    {
        private readonly string _headerName;
        private readonly string _headerValue;

        public AddHeaderRequestPolicy(string headerName, string headerValue) : base()
        {
            this._headerName = headerName;
            this._headerValue = headerValue;
        }

        public override ValueTask ProcessAsync(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline, int currentIndex)
        {
            message.Request.Headers.Add(this._headerName, this._headerValue);

            return ProcessNextAsync(message, pipeline, currentIndex);
        }

        public override void Process(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline, int currentIndex)
        {
            message.Request.Headers.Add(this._headerName, this._headerValue);

            ProcessNext(message, pipeline, currentIndex);
        }
    }
}
