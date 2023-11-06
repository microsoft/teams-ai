using Newtonsoft.Json.Linq;
using System.Net;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal sealed class RosterHttpMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK);

            // GetMembers (Team)
            if (request.RequestUri!.PathAndQuery.EndsWith("team-id/members"))
            {
                var content = new JArray
                    {
                        new JObject
                        {
                            new JProperty("id", "id-1"),
                            new JProperty("objectId", "objectId-1"),
                            new JProperty("name", "name-1"),
                            new JProperty("givenName", "givenName-1"),
                            new JProperty("surname", "surname-1"),
                            new JProperty("email", "email-1"),
                            new JProperty("userPrincipalName", "userPrincipalName-1"),
                            new JProperty("tenantId", "tenantId-1"),
                        },
                        new JObject
                        {
                            new JProperty("id", "id-2"),
                            new JProperty("objectId", "objectId-2"),
                            new JProperty("name", "name-2"),
                            new JProperty("givenName", "givenName-2"),
                            new JProperty("surname", "surname-2"),
                            new JProperty("email", "email-2"),
                            new JProperty("userPrincipalName", "userPrincipalName-2"),
                            new JProperty("tenantId", "tenantId-2"),
                        },
                    };
                response.Content = new StringContent(content.ToString());
            }

            // GetMembers (Group Chat)
            else if (request.RequestUri.PathAndQuery.EndsWith("conversation-id/members"))
            {
                var content = new JArray
                    {
                        new JObject
                        {
                            new JProperty("id", "id-3"),
                            new JProperty("objectId", "objectId-3"),
                            new JProperty("name", "name-3"),
                            new JProperty("givenName", "givenName-3"),
                            new JProperty("surname", "surname-3"),
                            new JProperty("email", "email-3"),
                            new JProperty("userPrincipalName", "userPrincipalName-3"),
                            new JProperty("tenantId", "tenantId-3"),
                        },
                        new JObject
                        {
                            new JProperty("id", "id-4"),
                            new JProperty("objectId", "objectId-4"),
                            new JProperty("name", "name-4"),
                            new JProperty("givenName", "givenName-4"),
                            new JProperty("surname", "surname-4"),
                            new JProperty("email", "email-4"),
                            new JProperty("userPrincipalName", "userPrincipalName-4"),
                            new JProperty("tenantId", "tenantId-4"),
                        },
                    };
                response.Content = new StringContent(content.ToString());
            }
            else if (request.RequestUri.PathAndQuery.EndsWith("team-id/members/id-1") || request.RequestUri.PathAndQuery.EndsWith("conversation-id/members/id-1"))
            {
                var content = new JObject
                        {
                            new JProperty("id", "id-1"),
                            new JProperty("objectId", "objectId-1"),
                            new JProperty("name", "name-1"),
                            new JProperty("givenName", "givenName-1"),
                            new JProperty("surname", "surname-1"),
                            new JProperty("email", "email-1"),
                            new JProperty("userPrincipalName", "userPrincipalName-1"),
                            new JProperty("tenantId", "tenantId-1"),
                        };
                response.Content = new StringContent(content.ToString());
            }

            return Task.FromResult(response);
        }
    }
}
