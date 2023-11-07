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
        public List<int> Encode(string text);
    }
}
