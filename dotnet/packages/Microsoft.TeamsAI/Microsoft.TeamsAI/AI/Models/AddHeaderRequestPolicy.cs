using Azure.Core.Pipeline;
using Azure.Core;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Helper class to inject headers into Azure SDK HTTP pipeline.
    /// </summary>
    internal class AddHeaderRequestPolicy : HttpPipelineSynchronousPolicy
    {
        private readonly string _headerName;
        private readonly string _headerValue;

        public AddHeaderRequestPolicy(string headerName, string headerValue)
        {
            this._headerName = headerName;
            this._headerValue = headerValue;
        }

        public override void OnSendingRequest(HttpMessage message)
        {
            message.Request.Headers.Add(this._headerName, this._headerValue);
        }
    }
}
