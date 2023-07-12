using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.TeamsAI.AI.Planner
{
    /// <summary>
    /// A predicted command is a command that the AI system should execute.
    /// </summary>
    public interface IPredictedCommand
    {
        /// <summary>
        /// The type of command to execute.
        /// </summary>
        string Type { get; }
    }
}
