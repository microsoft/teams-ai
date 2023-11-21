namespace Microsoft.Teams.AI.State
{

    /// <summary>
    /// Forks an existing memory.
    /// A memory fork is a memory that is a copy of another memory, but can be modified without affecting the original memory.
    /// </summary>
    public class MemoryFork : IMemory
    {
        private static readonly string TEMP_SCOPE = "temp";
        private readonly Dictionary<string, Record> _fork = new();
        private readonly IMemory? _memory;

        /// <summary>
        /// Creates a new `MemoryFork` instance.
        /// </summary>
        /// <param name="memory">Memory to fork.</param>
        public MemoryFork(IMemory? memory = null)
        {
            _memory = memory;
        }

        /// <summary>
        /// Deletes a value from the memory. Only forked values will be deleted.
        /// </summary>
        /// <param name="path">Path to the value to delete in the form of `[scope].property`.
        /// If scope is omitted, the value is deleted from the temporary scope.</param>
        public void DeleteValue(string path)
        {
            (string scope, string name) = GetScopeAndName(path);
            if (_fork.ContainsKey(scope) && _fork[scope].ContainsKey(name))
            {
                _fork[scope].Remove(name);
            }
        }

        /// <summary>
        /// Retrieves a value from the memory. The forked memory is checked first, then the original memory.
        /// </summary>
        /// <param name="path">Path to the value to retrieve in the form of `[scope].property`.
        /// If scope is omitted, the value is retrieved from the temporary scope.</param>
        /// <returns>The value or undefined if not found.</returns>
        public object? GetValue(string path)
        {
            (string scope, string name) = GetScopeAndName(path);
            if (_fork.ContainsKey(scope))
            {
                if (_fork[scope].ContainsKey(name))
                {
                    return _fork[scope][name];
                }
            }

            return _memory?.GetValue(path);
        }

        /// <summary>
        /// Checks if a value exists in the memory. The forked memory is checked first, then the original memory.
        /// </summary> 
        /// <param name="path">Path to the value to check in the form of `[scope].property`.
        /// If scope is omitted, the value is checked in the temporary scope.</param>
        /// <returns>True if the value exists, false otherwise.</returns>
        public bool HasValue(string path)
        {
            (string scope, string name) = GetScopeAndName(path);
            if (_fork.ContainsKey(scope))
            {
                return _fork[scope].ContainsKey(name);
            }

            if (_memory != null)
            {
                return _memory.HasValue(path);
            }

            return false;
        }

        /// <summary>
        /// Assigns a value to the memory. The value is assigned to the forked memory.
        /// </summary>
        /// <param name="path">Path to the value to assign in the form of `[scope].property`.
        /// If scope is omitted, the value is assigned to the temporary scope.</param>
        /// <param name="value">Value to assign.</param>
        public void SetValue(string path, object value)
        {
            (string scope, string name) = GetScopeAndName(path);
            if (!_fork.ContainsKey(scope))
            {
                _fork[scope] = new();
            }

            _fork[scope][name] = value;
        }

        private (string, string) GetScopeAndName(string path)
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
            return (parts[0], parts[1]);
        }
    }
}
