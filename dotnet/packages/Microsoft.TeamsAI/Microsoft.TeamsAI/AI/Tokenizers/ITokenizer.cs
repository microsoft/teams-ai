namespace Microsoft.Teams.AI.AI.Tokenizers
{
    /// <summary>
    /// Tokenizer
    /// </summary>
    public interface ITokenizer
    {
        /// <summary>
        /// Encode
        /// </summary>
        /// <param name="text">text to encode</param>
        /// <returns>encoded bytes</returns>
        public IReadOnlyList<int> Encode(string text);

        /// <summary>
        /// Decode
        /// </summary>
        /// <param name="tokens">tokens to decode</param>
        /// <returns>decoded string</returns>
        public string Decode(IEnumerable<int> tokens);
    }
}
