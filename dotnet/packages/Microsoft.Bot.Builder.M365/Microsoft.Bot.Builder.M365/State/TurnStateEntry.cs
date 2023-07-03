using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.State
{
    public class TurnStateEntry<TValue> where TValue : class
    {
        private TValue _value;
        private string? _storageKey;
        private bool _deleted = false;
        private int _hash;

        public TurnStateEntry(TValue value, string? storageKey = null)
        {
            Verify.ParamNotNull(value, nameof(value));

            _value = value;
            _storageKey = storageKey;
            _hash = value.GetHashCode();
        }

        private TurnStateEntry(TValue value, string? storageKey, bool deleted, int hash)
        {
            _value = value;
            _storageKey = storageKey;
            _deleted = deleted;
            _hash = hash;
        }

        public bool HasChanged
        {
            get { return _value.GetHashCode() == _hash; }
        }

        public bool IsDeleted
        {
            get { return _deleted; }
        }

        public TValue Value
        {
            get 
            {
                if (_deleted)
                {
                    // Switch to a replace scenario?
                    // TODO: Once TValue is sorted, figure this out.
                    throw new Exception("This entry has been deleted");
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
    }
}
