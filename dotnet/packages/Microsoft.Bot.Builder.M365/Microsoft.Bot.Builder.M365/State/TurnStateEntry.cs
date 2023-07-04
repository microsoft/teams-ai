using Microsoft.Bot.Builder.M365.Utilities;
using System.Text.Json;

namespace Microsoft.Bot.Builder.M365.State
{
    public class TurnStateEntry<TValue> where TValue : class
    {
        private TValue _value;
        private string? _storageKey;
        private bool _deleted = false;
        private string _hash;

        public TurnStateEntry(TValue value, string? storageKey = null)
        {
            Verify.ParamNotNull(value, nameof(value));

            _value = value;
            _storageKey = storageKey;
            _hash = ComputeHash(value);
        }

        private TurnStateEntry(TValue value, string? storageKey, bool deleted, string hash)
        {
            _value = value;
            _storageKey = storageKey;
            _deleted = deleted;
            _hash = hash;
        }

        public bool HasChanged
        {
            get { return ComputeHash(_value) != _hash; }
        }

        public bool IsDeleted
        {
            get { return _deleted; }
        }

        public TValue Value
        {
            get 
            {
                if (IsDeleted)
                {
                    _deleted = false;
                }

                return _value;
            }
        }

        public string? StorageKey 
        { 
            get { return _storageKey; } 
        }

        public void Delete()
        {
            _deleted = true;
        }

        public void Replace(TValue value)
        {
            Verify.ParamNotNull(value, nameof(value));

            _value = value;
        }

        public TurnStateEntry<T>? CastValue<T>() where T : class
        {
            if (_value is not T castedValue) return null;

            return new TurnStateEntry<T>(castedValue, _storageKey, _deleted, _hash);
        }

        internal static string ComputeHash(object obj)
        {
            Verify.ParamNotNull(obj);

            return JsonSerializer.Serialize(obj, new JsonSerializerOptions() { MaxDepth = 64 });
        }
    }
}
