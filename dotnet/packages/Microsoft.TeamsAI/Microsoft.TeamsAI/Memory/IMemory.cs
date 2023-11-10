using Microsoft.AspNetCore.Routing.Template;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Teams.AI.Memory
{
    /// <summary>
    /// Represents a memory.
    /// A memory is a key-value store that can be used to store and retrieve values.
    /// </summary>
    public interface IMemory
    {
        /// <summary>
        /// Deletes a value from the memory.
        ///
        /// Only forked values will be deleted.
        /// </summary>
        /// <param name="path">Path to the value to delete in the form of `[scope].property`. If scope is omitted, the value is deleted from the temporary scope.</param>
        public void DeleteValue(string path);

        /// <summary>
        /// Checks if a value exists in the memory.
        ///
        /// The forked memory is checked first, then the original memory.
        /// </summary>
        /// <param name="path">Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.</param>
        /// <returns>True if the value exists, false otherwise.</returns>
        public bool HasValue(string path);

        /// <summary>
        /// Retrieves a value from the memory.
        ///
        /// The forked memory is checked first, then the original memory.
        /// </summary>
        /// <typeparam name="TValue">The Value to be returned</typeparam>
        /// <param name="path">Path to the value to retrieve in the form of `[scope].property`. If scope is omitted, the value is retrieved from the temporary scope.</param>
        /// <returns>The value or null if not found.</returns>
        public TValue? GetValue<TValue>(string path) where TValue : class;

        /// <summary>
        /// Assigns a value to the memory.
        ///
        /// The value is assigned to the forked memory.
        /// </summary>
        /// <typeparam name="TValue">Value to assign.</typeparam>
        /// <param name="path">Path to the value to assign in the form of `[scope].property`. If scope is omitted, the value is assigned to the temporary scope.</param>
        /// <param name="value">Value to assign.</param>
        public void SetValue<TValue>(string path, TValue value) where TValue : class;
    }
}
