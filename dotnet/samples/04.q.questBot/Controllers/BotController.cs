using Microsoft.AspNetCore.Mvc;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;

namespace QuestBot.Controllers
{
    [Route("api/messages")]
    [ApiController]
    public class BotController : ControllerBase
    {
        private readonly CloudAdapter _adapter;
        private readonly IBot _bot;

        public BotController(CloudAdapter adapter, IBot bot)
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
            ).ConfigureAwait(false);
        }
    }
}
