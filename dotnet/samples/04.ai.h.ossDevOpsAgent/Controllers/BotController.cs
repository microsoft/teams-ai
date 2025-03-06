using Microsoft.AspNetCore.Mvc;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Newtonsoft.Json;

namespace OSSDevOpsAgent.Controllers
{
    [Route("api/messages")]
    [ApiController]
    public class BotController : ControllerBase
    {
        private readonly IBotFrameworkHttpAdapter _adapter;
        private readonly IBot _bot;

        public BotController(IBotFrameworkHttpAdapter adapter, IBot bot)
        {
            _adapter = adapter;
            _bot = bot;
        }

        [HttpPost]
        public async Task PostAsync(CancellationToken cancellationToken = default)
        {
            await _adapter.ProcessAsync
            (
                Request,
                Response,
                _bot,
                cancellationToken
            );
        }
    }

    [Route("api/webhook")]
    [ApiController]
    public class WebhookController : ControllerBase
    {
        private readonly IBotFrameworkHttpAdapter _adapter;
        private readonly IBot _bot;

        public WebhookController(IBotFrameworkHttpAdapter adapter, IBot bot)
        {
            _adapter = adapter;
            _bot = bot;
        }

        [HttpPost]
        public async Task PostAsync(CancellationToken cancellationToken = default)
        {
            string requestBody;
            using (var reader = new StreamReader(Request.Body))
            {
                requestBody = await reader.ReadToEndAsync();
            }

            var payload = JsonConvert.DeserializeObject<dynamic>(requestBody);
            var eventType = Request.Headers["x-github-event"].ToString();

            Console.WriteLine(payload);
            Console.WriteLine(eventType);

            Response.StatusCode = 200;
            await Response.WriteAsync("Event received", cancellationToken);
        }
    }
}
