using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.State
{
    public class StateBase : Dictionary<string, object>
    {
        public bool TryGetValue<T>(string key, out T value) where T : class
        {
            Verify.ParamNotNull(key, nameof(key));

            if (base.TryGetValue(key, out object entry))
            {
                if (entry is T castedEntry)
                {
                    value = castedEntry;
                    return true;
                };

                throw new Exception($"Failed to cast generic object to type '{typeof(T)}'");
            }

            value = null!;

            return false;
        }

        public T? Get<T>(string key) where T : class
        {
            Verify.ParamNotNull(key, nameof(key));

            if (TryGetValue(key, out T value))
            {
                return value;
            }
            else
            {
                return null!;
            };
        }

        public void Set<T>(string key, T value) where T : class
        {
            Verify.ParamNotNull(key, nameof(key));
            Verify.ParamNotNull(value, nameof(value));

            this[key] = value;
        }
    }
}
