
namespace Microsoft.Bot.Builder.M365.State
{
    public interface IReadOnlyEntry<out TValue> where  TValue : class
    {
        bool HasChanged { get; }

        public bool IsDeleted { get; }

        public TValue Value { get; }

        public string? StorageKey { get; }
    }
}
