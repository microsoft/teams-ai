
namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Represents a turn state entry.
    /// </summary>
    /// <typeparam name="TValue">The value type of the turn state entry</typeparam>
    public interface IReadOnlyEntry<out TValue> where TValue : class
    {
        /// <summary>
        /// Whether the entry has changed since it was loaded.
        /// </summary>
        bool HasChanged { get; }

        /// <summary>
        /// Whether the entry has been deleted.
        /// </summary>
        public bool IsDeleted { get; }

        /// <summary>
        /// The value of the entry.
        /// </summary>
        public TValue Value { get; }

        /// <summary>
        /// The key used to store the entry in storage.
        /// </summary>
        public string? StorageKey { get; }
    }
}
