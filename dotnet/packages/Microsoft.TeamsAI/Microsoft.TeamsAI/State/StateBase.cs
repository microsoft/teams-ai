using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// The base state class.
    /// </summary>
    public class StateBase : Dictionary<string, object>
    {
        /// <summary>
        /// Tries to get the value from the dictionary.
        /// </summary>
        /// <typeparam name="T">Type of the value</typeparam>
        /// <param name="key">key to look for</param>
        /// <param name="value">value associated with key</param>
        /// <returns>True if a value of given type is associated with key.</returns>
        /// <exception cref="InvalidCastException"></exception>
        public bool TryGetValue<T>(string key, out T value)
        {
            Verify.ParamNotNull(key);

            if (base.TryGetValue(key, out object entry))
            {
                if (entry is T castedEntry)
                {
                    value = castedEntry;
                    return true;
                };

                throw new InvalidCastException($"Failed to cast generic object to type '{typeof(T)}'");
            }

#pragma warning disable CS8601 // Possible null reference assignment.
            value = default;
#pragma warning restore CS8601 // Possible null reference assignment.

            return false;
        }

        /// <summary>
        /// Gets the value from the dictionary.
        /// </summary>
        /// <typeparam name="T">Type of the value</typeparam>
        /// <param name="key">key to look for</param>
        /// <returns>The value associated with the key</returns>
        public T? Get<T>(string key)
        {
            Verify.ParamNotNull(key);

            if (TryGetValue(key, out T value))
            {
                return value;
            }
            else
            {
                return default;
            };
        }

        /// <summary>
        /// Sets value in the dictionary.
        /// </summary>
        /// <typeparam name="T">Type of value</typeparam>
        /// <param name="key">key to look for</param>
        /// <param name="value">value associated with key</param>
        public void Set<T>(string key, T value)
        {
            Verify.ParamNotNull(key);
            Verify.ParamNotNull(value);

#pragma warning disable CS8601 // Possible null reference assignment.
            this[key] = value;
#pragma warning restore CS8601 // Possible null reference assignment.
        }
    }
}
