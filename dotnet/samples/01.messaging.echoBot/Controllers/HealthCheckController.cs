using Microsoft.AspNetCore.Mvc;
using Microsoft.Bot.Connector.Authentication;

namespace DriBotApp;

[Route("api/health")]
[ApiController]
public class HealthCheckController : ControllerBase
{
    private readonly ILogger<HealthCheckController> logger;

    public HealthCheckController(ILogger<HealthCheckController> logger, ServiceClientCredentialsFactory service)
    {
        this.logger = logger;
    }

    [HttpGet]
    public IActionResult HealthCheck()
    {
        this.logger.LogInformation($"starting {nameof(HealthCheckController)}.{nameof(HealthCheck)}");
        return Ok();
    }
}
