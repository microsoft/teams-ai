using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// The message context.
    /// </summary>
    public class MessageContext
    {
        /// <summary>
        /// Citations used in the message.
        /// </summary>
        public IList<Citation> Citations { get; set; } = new List<Citation>();

        /// <summary>
        /// The intent of the message.
        /// </summary>
        public string Intent { get; set; } = string.Empty;
    }

    /// <summary>
    /// Citations used in the message.
    /// </summary>
    public class Citation
    {
        /// <summary>
        /// The content of the citation.
        /// </summary>
        public string Content { get; set; }

        /// <summary>
        /// The title of the citation.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// The URL of the citation.
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Constructs a citation.
        /// </summary>
        /// <param name="content">The content of the citation.</param>
        /// <param name="title">The title of the citation.</param>
        /// <param name="url">The url of the citation.</param>
        public Citation(string content, string title, string url)
        {
            Verify.ParamNotNull(content);
            Verify.ParamNotNull(title);
            Verify.ParamNotNull(url);

            Content = content;
            Title = title;
            Url = url;
        }
    }
}
