using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using System.Net;

namespace Microsoft.Teams.AI
{
    internal static class ActivityUtilities
    {
        public static T? GetTypedValue<T>(Activity activity)
        {
            if (activity?.Value == null)
            {
                return default;
            }
            JObject? obj = activity.Value as JObject;
            if (obj == null)
            {
                return default;
            }
            T? invokeValue;
            try
            {
                invokeValue = obj.ToObject<T>();
            }
            catch
            {
                return default;
            }
            return invokeValue;
        }

        public static Activity CreateInvokeResponseActivity(object? body = default)
        {
            Activity activity = new()
            {
                Type = ActivityTypesEx.InvokeResponse,
                Value = new InvokeResponse { Status = (int)HttpStatusCode.OK, Body = body }
            };
            return activity;
        }
    }
}
