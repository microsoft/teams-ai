using Microsoft.ML.Tokenizers;

namespace Microsoft.Teams.AI.AI.Tokenizers
{
    /// <summary>
    /// GPT Tokenizer
    /// </summary>
    public class GPTTokenizer : ITokenizer
    {
        private readonly Tokenizer _encoding;

        /// <summary>
        /// Creates an instance of `GPTTokenizer` using "gpt-4" model name by default which is using the `cl100k_base` encoding
        /// </summary>
        public GPTTokenizer() => _encoding = TiktokenTokenizer.CreateForModel("gpt-4");

        /// <summary>
        /// Creates an instance of `GPTTokenizer`
        /// </summary>
        /// <param name="encoding">encoding to use</param>
        public GPTTokenizer(Tokenizer encoding) => this._encoding = encoding;

        /// <summary>
        /// Creates an instance of `GPTTokenizer`
        /// </summary>
        /// <param name="model">model to encode/decode for</param>
        public GPTTokenizer(string model) => this._encoding = TiktokenTokenizer.CreateForModel(model);

        /// <summary>
        /// Encode
        /// </summary>
        /// <param name="text">text to encode</param>
        /// <returns>encoded tokens</returns>
        public IReadOnlyList<int> Encode(string text) => this._encoding.EncodeToIds(text);

        /// <summary>
        /// Decode
        /// </summary>
        /// <param name="tokens">tokens to decode</param>
        /// <returns>decoded text</returns>
        public string Decode(IEnumerable<int> tokens) => this._encoding.Decode(tokens)!;
    }
}
