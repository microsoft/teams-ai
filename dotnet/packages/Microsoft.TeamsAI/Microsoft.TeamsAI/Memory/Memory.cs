namespace Microsoft.Teams.AI.Memory
{
    internal class MemoryPath
    {
        public string scope { get; set; }
        public string name { get; set; }

        public MemoryPath(string scope, string name)
        {
            this.scope = scope;
            this.name = name;
        }
    }

    /// <summary>
    /// Represents a memory.
    ///
    /// A memory is a key-value store that can be used to store and retrieve values.
    /// </summary>
    public class Memory : IMemory
    {
        private readonly Memory? _parent;
        private readonly Dictionary<string, Dictionary<string, dynamic>> _values;

        /// <summary>
        /// Creates a new `Memory` instance.
        /// </summary>
        /// <param name="parent">Memory to fork.</param>
        public Memory(Memory? parent = null)
        {
            this._parent = parent;
            this._values = new Dictionary<string, Dictionary<string, dynamic>>();
        }

        /// <summary>
        /// Deletes a value from the memory.
        ///
        /// Only forked values will be deleted.
        /// </summary>
        /// <param name="path">Path to the value to delete in the form of `[scope].property`. If scope is omitted, the value is deleted from the temporary scope.</param>
        public void DeleteValue(string path)
        {
            MemoryPath parsed = this.GetPath(path);

            if (this._values.ContainsKey(parsed.scope) && this._values[parsed.scope].ContainsKey(parsed.name))
            {
                this._values[parsed.scope].Remove(parsed.name);
            }
        }

        /// <summary>
        /// Checks if a value exists in the memory.
        ///
        /// The forked memory is checked first, then the original memory.
        /// </summary>
        /// <param name="path">Path to the value to check in the form of `[scope].property`. If scope is omitted, the value is checked in the temporary scope.</param>
        /// <returns>True if the value exists, false otherwise.</returns>
        public bool HasValue(string path)
        {
            MemoryPath parsed = this.GetPath(path);

            if (this._values.ContainsKey(parsed.scope))
            {
                return this._values[parsed.scope].ContainsKey(parsed.name);
            }

            if (this._parent != null)
            {
                return this._parent.HasValue(path);
            }

            return false;
        }

        /// <summary>
        /// Retrieves a value from the memory.
        ///
        /// The forked memory is checked first, then the original memory.
        /// </summary>
        /// <typeparam name="TValue">The Value to be returned</typeparam>
        /// <param name="path">Path to the value to retrieve in the form of `[scope].property`. If scope is omitted, the value is retrieved from the temporary scope.</param>
        /// <returns>The value or null if not found.</returns>
        public TValue? GetValue<TValue>(string path) where TValue : class
        {
            MemoryPath parsed = this.GetPath(path);

            if (this._values.ContainsKey(parsed.scope) && this._values[parsed.scope].ContainsKey(parsed.name))
            {
                return this._values[parsed.scope][parsed.name];
            }

            if (this._parent != null)
            {
                return this._parent.GetValue<TValue>(path);
            }

            return null;
        }

        /// <summary>
        /// Assigns a value to the memory.
        ///
        /// The value is assigned to the forked memory.
        /// </summary>
        /// <typeparam name="TValue">Value to assign.</typeparam>
        /// <param name="path">Path to the value to assign in the form of `[scope].property`. If scope is omitted, the value is assigned to the temporary scope.</param>
        /// <param name="value">Value to assign.</param>
        public void SetValue<TValue>(string path, TValue value) where TValue : class
        {
            MemoryPath parsed = this.GetPath(path);

            if (!this._values.ContainsKey(parsed.scope))
            {
                this._values[parsed.scope] = new Dictionary<string, dynamic>();
            }

            this._values[parsed.scope][parsed.name] = value;
        }

        private MemoryPath GetPath(string path)
        {
            List<string> parts = path.Split('.').ToList();

            if (parts.Count > 2)
            {
                throw new InvalidOperationException($"Invalid state path: {path}");
            }

            if (parts.Count == 1)
            {
                parts.Insert(0, "temp");
            }

            return new MemoryPath(parts[0], parts[1]);
        }
    }
}
