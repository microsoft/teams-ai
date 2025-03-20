namespace OSSDevOpsAgent.Model
{
    /// <summary>
    /// Defines a PR User
    /// </summary>
    public struct PRUser
    {
        public string Login { get; set; }
        public int Id { get; set; }
        public string AvatarUrl { get; set; }
        public string HtmlUrl { get; set; }
    }
}
