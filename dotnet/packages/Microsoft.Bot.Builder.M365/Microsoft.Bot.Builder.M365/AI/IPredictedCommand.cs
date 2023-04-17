using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI
{
//    [JsonConverter(typeof(PredictedCommandJsonConverter))]
    public interface IPredictedCommand
    {
        string Type { get; }
    }
}
