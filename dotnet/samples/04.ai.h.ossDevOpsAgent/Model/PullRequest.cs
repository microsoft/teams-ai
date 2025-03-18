namespace OSSDevOpsAgent.Model
{
    public struct PullRequest
    {
        public string Title { get; set; }
        public int Number { get; set; }
        public string State { get; set; }
        public User User { get; set; }
        public DateTime CreatedAt { get; set; }
        public string HtmlUrl { get; set; }
        public IList<PRLabel> Labels { get; set; }
        public IList<User> Assignees { get; set; }
        public string Body { get; set; }
    }

}
