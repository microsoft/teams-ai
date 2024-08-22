using System.ClientModel.Primitives;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestResponse : PipelineResponse
    {
#pragma warning disable CS8618
        public TestResponse(int status, string reasonPhrase)
#pragma warning restore CS8618
        {
            Status = status;
            ReasonPhrase = reasonPhrase;
            Content = BinaryData.FromString("");
#pragma warning disable CS8625
            HeadersCore = null;
#pragma warning restore CS8625
        }

        public override int Status { get; }

        public override string ReasonPhrase { get; }

        public override Stream? ContentStream { get; set; }

        public override BinaryData Content { get; }

        protected override PipelineResponseHeaders HeadersCore { get; }

        private bool? _isError;
        public override bool IsError => _isError ?? base.IsError;
        public void SetIsError(bool value)
        {
            _isError = value;
        }

        public bool IsDisposed { get; private set; }

        public override BinaryData BufferContent(CancellationToken cancellationToken)
        {
            return BinaryData.FromString("");
        }

        public override ValueTask<BinaryData> BufferContentAsync(CancellationToken cancellationToken)
        {
            return ValueTask.FromResult(BinaryData.FromString(""));
        }

        public override void Dispose()
        {
            IsDisposed = true;
        }
    }
}
