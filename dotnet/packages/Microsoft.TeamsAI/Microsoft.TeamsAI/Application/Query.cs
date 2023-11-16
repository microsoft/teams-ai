namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Query arguments for Message Extension query and Adaptive Card dynamic search.
    /// </summary>
    /// <typeparam name="TParams">Type of the query parameters.</typeparam>
    public class Query<TParams>
    {
        /// <summary>
        /// Number of items to return in the result set.
        /// </summary>
        public int Count { get; set; }

        /// <summary>
        /// Number of items to skip in the result set.
        /// </summary>
        public int Skip { get; set; }

        /// <summary>
        /// Query parameters.
        /// </summary>
        public TParams Parameters { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="Query{TParams}"/> class.
        /// </summary>
        /// <param name="count">Number of items to return in the result set.</param>
        /// <param name="skip">Number of items to skip in the result set.</param>
        /// <param name="parameters">Query parameters.</param>
        public Query(int count, int skip, TParams parameters)
        {
            this.Count = count;
            this.Skip = skip;
            this.Parameters = parameters;
        }
    }
}
