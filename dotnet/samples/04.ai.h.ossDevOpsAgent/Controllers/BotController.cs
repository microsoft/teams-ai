using Microsoft.AspNetCore.Mvc;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Newtonsoft.Json;
using DevOpsAgent.Interfaces;

namespace DevOpsAgent.Controllers
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
    // Responsible for directing repository webhooks.
    public class WebhookController : ControllerBase
    {
        private readonly IRepositoryService _repositoryService;

        public WebhookController(IRepositoryService repositoryService)
        {
            this._repositoryService = repositoryService;
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
            await this._repositoryService.HandleWebhook(payload, cancellationToken, Request, Response);
        }
    }
}
