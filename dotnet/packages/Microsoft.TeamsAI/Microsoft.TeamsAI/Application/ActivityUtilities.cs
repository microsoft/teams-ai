using Microsoft.Copilot.BotBuilder;
using Microsoft.Copilot.Protocols.Connector;
using Microsoft.Copilot.Protocols.Primitives;
using Newtonsoft.Json.Linq;
using System.Net;

namespace Microsoft.Teams.AI
{
    internal static class ActivityUtilities
    {
        public static T? GetTypedValue<T>(IActivity activity)
        {
            if (activity?.Value == null)
            {
                return default;
            }

            return SerializationExtensions.ToObject<T>(activity.Value);
        }

        public static Activity CreateInvokeResponseActivity(object? body = default)
        {
            Activity activity = new()
            {
                Type = ActivityTypes.InvokeResponse,
                Value = new InvokeResponse { Status = (int)HttpStatusCode.OK, Body = body }
            };
            return activity;
        }
    }
}
