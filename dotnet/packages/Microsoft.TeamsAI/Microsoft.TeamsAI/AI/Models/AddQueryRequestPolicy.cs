using Azure.Core.Pipeline;
using Azure.Core;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Helper class to inject query into Azure SDK HTTP pipeline.
    /// </summary>
    internal class AddQueryRequestPolicy : HttpPipelineSynchronousPolicy
    {
        private readonly string _queryName;
        private readonly string _queryValue;

        public AddQueryRequestPolicy(string queryName, string queryValue)
        {
            this._queryName = queryName;
            this._queryValue = queryValue;
        }

        public override void OnSendingRequest(HttpMessage message)
        {
            message.Request.Uri.AppendQuery(_queryName, _queryValue);
        }
    }
}
