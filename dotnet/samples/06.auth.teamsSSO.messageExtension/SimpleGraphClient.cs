using System.Net.Http.Headers;
using Microsoft.Graph;

namespace MessageExtensionAuth
{
    public class SimpleGraphClient
    {
        private readonly string _token;

        public SimpleGraphClient(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ArgumentNullException(nameof(token));
            }

            _token = token;
        }

        //Fetching user's profile 
        public async Task<User> GetMyProfile()
        {
            var graphClient = GetAuthenticatedClient();
            return await graphClient.Me.Request().GetAsync();
        }

        public async Task<string> GetMyPhoto()
        {
            var graphClient = GetAuthenticatedClient();
            var photo = await graphClient.Me.Photo.Content.Request().GetAsync();
            var memoryStream = new MemoryStream();
            await photo.CopyToAsync(memoryStream);
            var photoBytes = memoryStream.ToArray();
            var photoBase64 = Convert.ToBase64String(photoBytes);
            var photoUri = $"data:image/png;base64,{photoBase64}";
            return photoUri;
        }

        // Get an Authenticated Microsoft Graph client using the token issued to the user.
        private GraphServiceClient GetAuthenticatedClient()
        {
            var graphClient = new GraphServiceClient(
                new DelegateAuthenticationProvider(
                    requestMessage =>
                    {
                        // Append the access token to the request.
                        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("bearer", _token);

                        return Task.CompletedTask;
                    }));
            return graphClient;
        }
    }
}
