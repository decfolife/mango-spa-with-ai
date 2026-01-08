using MangoSPA.Models;
using MangoSPA.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using static MangoSPA.Constants;

namespace MangoSPA.Controllers;

[Authorize(Policy = Policy.FullAccess)]
[Route("[controller]")]
public class SessionsController : ControllerBase
{
    readonly ISessionService _sessionService;

    public SessionsController(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    /// <summary>
    /// Fetch all active sessions.
    /// </summary>
    /// <returns></returns>
    [HttpGet] //sessions
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthenticatedUser>> GetActiveSessions()
    {
        var sessions = await _sessionService.GetActiveSessionsAsync();
        var result = new AuthSessionResponse { Total = sessions.Count, Data = sessions };

        return Ok(result);
    }

    /// <summary>
    /// Fetch all active sessions for a user.
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    [HttpGet("user")] //sessions/user
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthenticatedUser>> GetActiveSessionsForUser([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest();

        var sessions = await _sessionService.GetActiveSessionsForUserAsync(email);
        var result = new AuthSessionResponse { Total = sessions.Count, Data = sessions };

        return Ok(result);
    }

    /// <summary>
    /// Delete an active user's session.
    /// </summary>
    /// <param name="sessionId"></param>
    /// <returns></returns>
    [HttpDelete] //sessions
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthenticatedUser>> DeleteActiveSession([FromQuery] string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
            return BadRequest();

        await _sessionService.DeleteActiveSessionAsync(sessionId);
        return Ok();
    }

    /// <summary>
    /// Delete all active sessions for a user.
    /// </summary>
    /// <param name="email"></param>
    /// <returns></returns>
    [HttpDelete("user")] //sessions/user
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AuthenticatedUser>> DeleteActiveSessionsForUser([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest();

        await _sessionService.DeleteActiveSessionsForUserAsync(email);

        return Ok();
    }

    /// <summary>
    /// Create shared info cookie to be shared amongst Mango SPA AND V06.
    /// This method should not be needed once V06 is gone.
    /// </summary>
    /// <param name="idleTimeout"></param>
    /// <param name="env"></param>
    /// <param name="config"></param>
    /// <returns></returns>
    //[HttpPost("shared-info")] //sessions/shared-info/{idleTimeout}  
    //[ProducesResponseType(StatusCodes.Status401Unauthorized)]
    //[ProducesResponseType(StatusCodes.Status200OK)]
    //[ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //public ActionResult CreateSharedInfoCookie(
    //    [FromQuery] int idleTimeout,
    //    [FromServices] IWebHostEnvironment env, 
    //    [FromServices] IConfiguration config)
    //{
    //    var clientKey = User.ClientKey();
    //    var data = JsonSerializer.Serialize(new SharedInfo(idleTimeout));

    //    HttpContext.Response.Cookies.Append(
    //        $"{clientKey}.SharedInfo", data, 
    //        new CookieOptions
    //        {
    //            //Domain = HttpContext.Request.Host.Value, // what is host value? do we need to use appSettings instead?
    //            SameSite = env.IsLocal() ? SameSiteMode.None : SameSiteMode.Strict,
    //            Secure = true,
    //            HttpOnly = false,
    //            Expires = DateTimeOffset.UtcNow.AddMinutes(config.CookieExpirationInMinutes())
    //        });

    //    return Ok();
    //}

    ///// <summary>
    ///// Get the current user session data.
    ///// </summary>
    ///// <returns></returns>
    //[HttpGet] //sessions/user/data
    //[ProducesResponseType(StatusCodes.Status200OK)]
    //[ProducesResponseType(StatusCodes.Status404NotFound)]
    //[ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //public async Task<ActionResult<SessionDto>> GetSessionData()
    //{
    //    var sessionId = HttpContext.User.SessionId();
    //    ArgumentNullException.ThrowIfNullOrWhiteSpace(sessionId);

    //    var cacheKey = CacheKeys.UserSessionData(sessionId);

    //    var session = await _cache.GetData<SessionDto>(cacheKey);
    //    if (session is null)
    //    {
    //        return NotFound();
    //    }

    //    return Ok(session);
    //}

    ///// <summary>
    ///// Add or update the current user session data.
    ///// </summary>
    ///// <param name="session"></param>
    ///// <returns></returns>
    //[HttpPost] //session/user
    //[ProducesResponseType(StatusCodes.Status200OK)]
    //[ProducesResponseType(StatusCodes.Status500InternalServerError)]
    //public async Task<ActionResult> SaveSessionData(SessionDto session)
    //{
    //    var sessionId = HttpContext.User.SessionId();
    //    ArgumentNullException.ThrowIfNullOrWhiteSpace(sessionId);

    //    var cacheKey = CacheKeys.UserSessionData(sessionId);
    //    await _cache.SetData(cacheKey, session);

    //    return Ok();
    //}

    ///// <summary>
    ///// Build session key from Identity claims.
    ///// </summary>
    ///// <returns></returns>
    //private string GetSessionDataKey()
    //{
    //    var contactId = HttpContext.User.ContactId();
    //    var client = HttpContext.User.ClientKey();

    //    return $"{contactId}-{client}";
    //}
}
