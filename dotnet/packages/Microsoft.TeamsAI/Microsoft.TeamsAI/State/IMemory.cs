namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Represents a memory, a key-value store that can be used to store and retrieve values.
    /// </summary>
    public interface IMemory
    {
        /// <summary>
        /// Deletes a value from the memory.
        /// </summary>
        /// <param name="path">Path to the value to delete in the form of `[scope].property`.
        /// If scope is omitted, the value is deleted from the temporary scope.</param>
        void DeleteValue(string path);

        /// <summary>
        /// Checks if a value exists in the memory.
        /// </summary>
        /// <param name="path">Path to the value to check in the form of `[scope].property`.
        /// If scope is omitted, the value is checked in the temporary scope.</param>
        /// <returns>True if the value exists, false otherwise.</returns>
        bool HasValue(string path);

        /// <summary>
        /// Retrieves a value from the memory.
        /// </summary>
        /// <param name="path">Path to the value to retrieve in the form of `[scope].property`.
        /// If scope is omitted, the value is retrieved from the temporary scope.</param>
        /// <returns>The value or undefined if not found.</returns>
        object? GetValue(string path);

        /// <summary>
        /// Assigns a value to the memory.
        /// </summary>
        /// <param name="path">Path to the value to assign in the form of `[scope].property`.
        /// If scope is omitted, the value is assigned to the temporary scope.</param>
        /// <param name="value">Value to assign.</param>
        void SetValue(string path, object value);
    }
}
