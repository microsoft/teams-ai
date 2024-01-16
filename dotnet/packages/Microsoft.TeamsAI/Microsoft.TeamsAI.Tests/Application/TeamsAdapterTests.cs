using System.Net.Http.Headers;
using System.Reflection;
using Microsoft.Extensions.Configuration;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class TeamsAdapterTests
    {
        [Fact]
        public void Test_TeamsAdapter_HasDefaultHeaders()
        {
            string version = Assembly.GetAssembly(typeof(TeamsAdapter))?.GetName().Version?.ToString() ?? "";
            ProductInfoHeaderValue productInfo = new("teamsai-dotnet", version);
            TeamsAdapter adapter = new();
            Assert.NotNull(adapter.HttpClientFactory);

            HttpClient client = adapter.HttpClientFactory.CreateClient();
            Assert.NotNull(client);
            Assert.True(client.DefaultRequestHeaders.UserAgent.Contains(productInfo));
        }

        [Fact]
        public void Test_TeamsAdapter_NoDuplicateDefaultHeaders()
        {
            string version = Assembly.GetAssembly(typeof(TeamsAdapter))?.GetName().Version?.ToString() ?? "";
            ProductInfoHeaderValue productInfo = new("teamsai-dotnet", version);
            ConfigurationBuilder config = new();
            TeamsAdapter adapter = new(config.Build(), new TeamsHttpClientFactory());
            Assert.NotNull(adapter.HttpClientFactory);

            HttpClient client = adapter.HttpClientFactory.CreateClient();
            Assert.NotNull(client);
            Assert.True(client.DefaultRequestHeaders.UserAgent.Contains(productInfo));
            Assert.True(client.DefaultRequestHeaders.UserAgent.Count == 1);
        }
    }
}
