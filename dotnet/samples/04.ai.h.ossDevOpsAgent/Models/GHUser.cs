namespace OSSDevOpsAgent.Models
{
    /// <summary>
    /// Defines a GitHub User
    /// </summary>
    public struct GHUser
    {
        public string Login { get; set; }
        public int Id { get; set; }
        public string AvatarUrl { get; set; }
        public string HtmlUrl { get; set; }
    }
}
