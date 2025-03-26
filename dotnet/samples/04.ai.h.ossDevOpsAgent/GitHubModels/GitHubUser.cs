namespace DevOpsAgent.GitHubModels
{
    /// <summary>
    /// Defines a GitHub User.
    /// </summary>
    public struct GitHubUser
    {
        /// <summary>
        /// The user's name.
        /// </summary>
        public string Login { get; set; }
        /// <summary>
        /// The user's ID
        /// </summary>.
        public int Id { get; set; }
        /// <summary>
        /// The user's avatar link.
        /// </summary>
        public string AvatarUrl { get; set; }
        /// <summary>
        /// The user's profile link.
        /// </summary>
        public string HtmlUrl { get; set; }
    }
}
