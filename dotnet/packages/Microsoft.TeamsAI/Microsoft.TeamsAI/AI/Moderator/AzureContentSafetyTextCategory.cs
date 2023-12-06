using Azure.AI.ContentSafety;

namespace Microsoft.Teams.AI.AI.Moderator
{
    /// <summary>
    /// Text analyze category for <see cref="AzureContentSafetyModeratorOptions"/>.
    /// </summary>
    public enum AzureContentSafetyTextCategory
    {
        /// <summary>
        /// Hate.
        /// </summary>
        Hate,

        /// <summary>
        /// Sexual.
        /// </summary>
        Sexual,

        /// <summary>
        /// SelfHarm.
        /// </summary>
        SelfHarm,

        /// <summary>
        /// Violence.
        /// </summary>
        Violence
    }

    internal static class AzureContentSafetyTextCategoryExtensions
    {
        public static TextCategory ToTextCategory(this AzureContentSafetyTextCategory category)
        {
            switch (category)
            {
                case AzureContentSafetyTextCategory.Hate:
                    return TextCategory.Hate;
                case AzureContentSafetyTextCategory.Sexual:
                    return TextCategory.Sexual;
                case AzureContentSafetyTextCategory.SelfHarm:
                    return TextCategory.SelfHarm;
                case AzureContentSafetyTextCategory.Violence:
                    return TextCategory.Violence;
                default:
                    throw new InvalidOperationException($"Invalid text category {category}.");
            }
        }
    }
}
