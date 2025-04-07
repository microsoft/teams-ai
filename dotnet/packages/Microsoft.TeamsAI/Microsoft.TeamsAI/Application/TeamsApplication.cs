using Microsoft.Agents.Builder.App;
using System;

namespace Microsoft.Teams.AI.Application;

/// <summary>
/// Represents a Teams application that can be used to build and deploy intelligent agents within Microsoft Teams.
/// </summary>
public class TeamsApplication : AgentApplication
{
    /// <summary>
    /// Initializes a new instance of the <see cref="TeamsApplication"/> class with the specified options.
    /// </summary>
    /// <param name="options">The agent application options to leverage.</param>
    public TeamsApplication(AgentApplicationOptions options) : base(options)
    {
    }
}
