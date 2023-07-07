using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.State
{
    public class TurnStateBase : Dictionary<string, TurnStateEntry<object>>
    {
        public bool TryGetValue<T>(string key, out TurnStateEntry<T> value) where T : class
        {
            Verify.ParamNotNull(key, nameof(key));

            if (base.TryGetValue(key, out TurnStateEntry<object> entry))
            {
                TurnStateEntry<T>? castedEntry = entry.CastValue<T>();
                if (castedEntry != null)
                {
                    value = castedEntry;
                    return true;
                };

                throw new Exception($"Failed to cast generic object to type '{typeof(T)}'");
            }

            value = null!;

            return false;
        }

        public TurnStateEntry<T>? Get<T>(string key) where T : class
        {
            Verify.ParamNotNull(key, nameof(key));

            if (TryGetValue(key, out TurnStateEntry<T> value))
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

            this[key] = new TurnStateEntry<object>(value, key);
        }

        public void SetValue<T>(string key, T value) where T : class
        {
            Verify.ParamNotNull(key, nameof(key));
            Verify.ParamNotNull(value, nameof(value));

            if (TryGetValue(key, out TurnStateEntry<T> entry))
            {
                entry.Replace(value);
                return;
            };

            this[key] = new TurnStateEntry<object>(value, key);
        }
    }
}
