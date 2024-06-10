using Microsoft.Identity.Client;
using System.Security.Cryptography.X509Certificates;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    internal sealed class AppConfig : IAppConfig
    {
#pragma warning disable CS8618 // This class is for test purpose only
        public AppConfig(string clientId, string tenantId)
#pragma warning restore CS8618
        {
            ClientId = clientId;
            TenantId = tenantId;
        }

        public string ClientId { get; }

        public bool EnablePiiLogging { get; }

        public IMsalHttpClientFactory HttpClientFactory { get; }

        public LogLevel LogLevel { get; }

        public bool IsDefaultPlatformLoggingEnabled { get; }

        public string RedirectUri { get; }

        public string TenantId { get; }

        public LogCallback LoggingCallback { get; }

        public IDictionary<string, string> ExtraQueryParameters { get; }

        public bool IsBrokerEnabled { get; }

        public string ClientName { get; }

        public string ClientVersion { get; }

        [Obsolete]
        public ITelemetryConfig TelemetryConfig { get; }

        public bool ExperimentalFeaturesEnabled { get; }

        public IEnumerable<string> ClientCapabilities { get; }

        public bool LegacyCacheCompatibilityEnabled { get; }

        public string ClientSecret { get; }

        public X509Certificate2 ClientCredentialCertificate { get; }

        public Func<object> ParentActivityOrWindowFunc { get; }
    }
}
