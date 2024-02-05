using System.ComponentModel;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Chat Role
    /// </summary>
    public readonly partial struct ChatRole : IEquatable<ChatRole>
    {
        /// <summary>
        /// Raw String Value
        /// </summary>
        [JsonPropertyName("value")]
        public readonly string Value;

        /// <summary>
        /// Initializes a new instance of <see cref="ChatRole"/>.
        /// </summary>
        /// <param name="value">value</param>
        /// <exception cref="ArgumentNullException"><paramref name="value"/> is null.</exception>
        public ChatRole(string value)
        {
            Value = value ?? throw new ArgumentNullException(nameof(value));
        }

        private const string SystemValue = "system";
        private const string AssistantValue = "assistant";
        private const string UserValue = "user";
        private const string FunctionValue = "function";
        private const string ToolValue = "tool";

        /// <summary>
        /// The role that instructs or sets the behavior of the assistant.
        /// </summary>
        public static ChatRole System { get; } = new(SystemValue);

        /// <summary>
        /// The role that provides responses to system-instructed, user-prompted input.
        /// </summary>
        public static ChatRole Assistant { get; } = new(AssistantValue);

        /// <summary>
        /// The role that provides input for chat completions.
        /// </summary>
        public static ChatRole User { get; } = new(UserValue);

        /// <summary>
        /// The role that provides function results for chat completions.
        /// </summary>
        public static ChatRole Function { get; } = new(FunctionValue);

        /// <summary>
        /// The role that represents extension tool activity within a chat completions operation.
        /// </summary>
        public static ChatRole Tool { get; } = new(ToolValue);

        /// <summary>
        /// Determines if two <see cref="ChatRole"/> values are the same.
        /// </summary>
        /// <param name="left">left</param>
        /// <param name="right">right</param>
        /// <returns>equality</returns>
        public static bool operator ==(ChatRole left, ChatRole right)
        {
            return left.Equals(right);
        }

        /// <summary>
        /// Determines if two <see cref="ChatRole"/> values are not the same.
        /// </summary>
        /// <param name="left">left</param>
        /// <param name="right">right</param>
        /// <returns>equality</returns>
        public static bool operator !=(ChatRole left, ChatRole right)
        {
            return !left.Equals(right);
        }

        /// <summary>
        /// Converts a string to a <see cref="ChatRole"/>.
        /// </summary>
        /// <param name="value">value</param>
        public static implicit operator ChatRole(string value)
        {
            return new(value);
        }

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override bool Equals(object obj)
        {
            return obj is ChatRole other && Equals(other);
        }

        /// <inheritdoc />
        public bool Equals(ChatRole other)
        {
            return string.Equals(Value, other.Value, StringComparison.InvariantCultureIgnoreCase);
        }

        /// <inheritdoc />
        [EditorBrowsable(EditorBrowsableState.Never)]
        public override int GetHashCode()
        {
            return Value?.GetHashCode() ?? 0;
        }

        /// <inheritdoc />
        public override string ToString()
        {
            return Value;
        }
    }
}
