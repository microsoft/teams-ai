using Microsoft.Bot.Builder;

namespace QuestBot.Store
{
    public class LastWriterWinsMemoryStore : IStorage
    {
        private readonly MemoryStorage _memoryStorage;

        public LastWriterWinsMemoryStore()
        {
            _memoryStorage = new();
        }

        public Task DeleteAsync(string[] keys, CancellationToken cancellationToken = default)
        {
            return _memoryStorage.DeleteAsync(keys, cancellationToken);
        }

        public Task<IDictionary<string, object>> ReadAsync(string[] keys, CancellationToken cancellationToken = default)
        {
            return _memoryStorage.ReadAsync(keys, cancellationToken);
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
            return _memoryStorage.WriteAsync(changes, cancellationToken);
        }
    }
}
