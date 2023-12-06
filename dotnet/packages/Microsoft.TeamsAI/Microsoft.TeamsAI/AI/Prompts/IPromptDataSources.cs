using Microsoft.Teams.AI.AI.DataSources;

namespace Microsoft.Teams.AI.AI.Prompts
{
    /// <summary>
    /// Prompt Data Sources
    /// </summary>
    public interface IPromptDataSources
    {
        /// <summary>
        /// Check If Has DataSource
        /// </summary>
        /// <param name="name">datasource name</param>
        /// <returns>true if has datasource, otherwise false</returns>
        public bool HasDataSource(string name);

        /// <summary>
        /// Get DataSource
        /// </summary>
        /// <param name="name">datasource name</param>
        /// <returns>the datasource if it exists, otherwise null</returns>
        public IDataSource? GetDataSource(string name);

        /// <summary>
        /// Add A DataSource
        /// </summary>
        /// <param name="name">name</param>
        /// <param name="dataSource">DataSource to add</param>
        public void AddDataSource(string name, IDataSource dataSource);
    }
}
