using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Azure.Blobs;

namespace QuestBot.Store
{
    public class LastWriterWinsStore : IStorage
    {
        private readonly BlobsStorage _blobsStorage;

        public LastWriterWinsStore(string dataConnectionString, string containerName)
        {
            _blobsStorage = new(dataConnectionString, containerName);
        }

        public Task DeleteAsync(string[] keys, CancellationToken cancellationToken = default)
        {
            return _blobsStorage.DeleteAsync(keys, cancellationToken);
        }

        public Task<IDictionary<string, object>> ReadAsync(string[] keys, CancellationToken cancellationToken = default)
        {
            return _blobsStorage.ReadAsync(keys, cancellationToken);
        }

        public Task WriteAsync(IDictionary<string, object> changes, CancellationToken cancellationToken = default)
        {
            // Remove any eTags
            foreach (var changeValue in changes.Values)
            {
                if (changeValue is IStoreItem item)
                {
                    item.ETag = string.Empty;
                }
            }
            return _blobsStorage.WriteAsync(changes, cancellationToken);
        }
    }
}
