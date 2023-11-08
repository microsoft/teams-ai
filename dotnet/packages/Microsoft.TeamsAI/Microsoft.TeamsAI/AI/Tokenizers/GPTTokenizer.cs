using SharpToken;

namespace Microsoft.Teams.AI.AI.Tokenizers
{
    /// <summary>
    /// GPT Tokenizer
    /// </summary>
    public class GPTTokenizer : ITokenizer
    {
        private readonly GptEncoding _encoding;

        /// <summary>
        /// Creates an instance of `GPTTokenizer`
        /// </summary>
        /// <param name="encoding">encoding to use</param>
        public GPTTokenizer(GptEncoding encoding)
        {
            this._encoding = encoding;
        }

        /// <summary>
        /// Creates an instance of `GPTTokenizer`
        /// </summary>
        /// <param name="model">model to encode/decode for</param>
        public GPTTokenizer(string model)
        {
            this._encoding = GptEncoding.GetEncodingForModel(model);
        }

        /// <summary>
        /// Encode
        /// </summary>
        /// <param name="text">text to encode</param>
        /// <returns>encoded tokens</returns>
        public List<int> Encode(string text)
        {
            return this._encoding.Encode(text);
        }

        /// <summary>
        /// Decode
        /// </summary>
        /// <param name="tokens">tokens to decode</param>
        /// <returns>decoded text</returns>
        public string Decode(List<int> tokens)
        {
            return this._encoding.Decode(tokens);
        }
    }
}
