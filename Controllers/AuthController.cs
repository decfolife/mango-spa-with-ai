using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using MangoSPA.Models;
using MangoSPA.Services;
using MangoSPA.Extensions;
using Microsoft.AspNetCore.Hosting;
using System.Text.Json;

namespace MangoSPA.Controllers;

[Route("[controller]")]
public class AuthController : ControllerBase
{
    readonly IAuthService _authService;
    readonly ICacheService _cache;
    readonly ILogger<AuthController> _logger;
    readonly IWebHostEnvironment _env;

    public AuthController(
        IAuthService authService, 
        ILogger<AuthController> logger,
        IWebHostEnvironment env,
        ICacheService cache)
    {
        _authService = authService;
        _logger = logger;
        _env = env;
        _cache = cache;
    }

    /// <summary>
    /// Calls Identity API to get accessToken (JWT).
    /// Then logs the user in using an authentication cookie.
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [IgnoreAntiforgeryToken]
    [HttpPost("~/oauth/token")] //api/oauth/token  
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<OAuthResponse>> AccessToken([FromBody] AccessTokenRequest request)
    {
        await HttpContext.SignOutAsync();

        var key = CacheKeys.EmulatedUser(User.ClientKey(), User.ContactId());
        await _cache.RemoveAsync(key);

        _logger.LogInformation("AccessToken request started. Calling Identity API to get access token.");

        var tokenResponse = await _authService.OAuthToken(request);
        if (tokenResponse is null) return Unauthorized();

        // If source has a value, there is no need to generate an auth code for V06.
        if (!string.IsNullOrWhiteSpace(request.Source) && request.Source.Equals("v06", StringComparison.OrdinalIgnoreCase)) 
        {
            await _authService.CreateAuthenticationCookie(tokenResponse.AccessToken);
            _logger.LogInformation("AccessToken request completed successfully.");

            return Ok(new OAuthResponse
            {
                AccessToken = tokenResponse.AccessToken,
                RedirectUri = request.RedirectUri
            });
        }

        _logger.LogInformation("Calling Identity API to get generate an auth code for V06.");

        // Generate a new authCode for V06 so it can use it fetch the JWT
        var authorizeResponse = await _authService.OAuthAuthorize(tokenResponse.AccessToken, request.RedirectUri);
        if (authorizeResponse is null) return Unauthorized();

        await _authService.CreateAuthenticationCookie(tokenResponse.AccessToken);

        var result = new OAuthResponse
        {
            AccessToken = tokenResponse.AccessToken,  
            Code = authorizeResponse.Code,
            RedirectUri = authorizeResponse.RedirectUri
        };

        _logger.LogInformation("AccessToken request completed successfully.");

        return Ok(result);
    }

    /// <summary>
    /// Used for LOCAL testing only.
    /// </summary>
    /// <param name="accessToken"></param>
    /// <param name="env"></param>
    /// <returns></returns>
    [ApiExplorerSettings(IgnoreApi = true)]
    [IgnoreAntiforgeryToken]
    [HttpPost("login")] //auth/login  
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<OAuthResponse>> Login(
        [FromBody] string accessToken,
        [FromServices] IWebHostEnvironment env)
    {
        if (!env.IsLocal())
            return BadRequest("Only allowed in LOCAL.");

        await HttpContext.SignOutAsync();

        var key = CacheKeys.EmulatedUser(User.ClientKey(), User.ContactId());
        await _cache.RemoveAsync(key);

        _logger.LogInformation("login request started.");

        await _authService.CreateAuthenticationCookie(accessToken);

        _authService.CreateCSRFTokenCookie();

        // Mimic V06 creating the shared info cookie
        HttpContext.Response.Cookies.Append(
            $"blank.SharedInfo", JsonSerializer.Serialize(new SharedInfo(2)),
            new CookieOptions
            {
                //Domain = HttpContext.Request.Host.Value, // what is host value? do we need to use appSettings instead?
                SameSite = env.IsLocal() ? SameSiteMode.None : SameSiteMode.Strict,
                Secure = true,
                HttpOnly = false,
                Expires = DateTimeOffset.UtcNow.AddMinutes(480)
            });

        _logger.LogInformation("login request completed successfully.");

        return Ok();
    }

    /// <summary>
    /// Get the current logged-in user.
    /// </summary>
    /// <returns></returns>
    [Authorize]
    [HttpGet("user")] //auth/user
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public ActionResult<AuthenticatedUser> GetCurrentUser()
    {
        _logger.LogInformation("Fetching current logged-in user {Email}.", User.Email());

        var user = User.ToAuthenticatedUser();

        // Create/Refresh CSRF token in case its gone but the user is still logged in since csrf token is session based.
        _authService.CreateCSRFTokenCookie();

        _logger.LogInformation("Successfully fetched current logged-in user {Email}.", User.Email());

        return Ok(user);
    }

    [IgnoreAntiforgeryToken]
    [HttpPost("logout")] //auth/logout   
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Logout()
    {
        await HttpContext.SignOutAsync();

        var key = CacheKeys.EmulatedUser(User.ClientKey(), User.ContactId());
        await _cache.RemoveAsync(key);

        foreach (var cookie in Request.Cookies.Keys)
            Response.Cookies.Delete(cookie);

        return Ok();
    }

    [Authorize]
    [HttpPost("emulate-user")] //auth/emulate-user  
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> EmulateUser([FromBody] EmulateUserRequest request)
    {
        if (_env.IsProd())
        {
            _logger.LogError("Emulate user is not allowed in PROD.");
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        if (!User.IsSuperUserContact())
        {
            _logger.LogError("Only a super user can emulate a user. {ContactId} | {Role}", User.ContactId(), User.ContactRole());
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var accessToken = await _authService.GetAccessTokenForEmulatedUser(request);
        if (string.IsNullOrWhiteSpace(accessToken))
            return BadRequest();

        var key = CacheKeys.EmulatedUser(User.ClientKey(), User.ContactId());
        var emulatedUser = new EmulatedUser(request.ContactId, accessToken);

        await _cache.SetDataAsync(key, emulatedUser);

        return Ok();
    }

    [Authorize]
    [HttpGet("emulate-user")] //auth/emulate-user  
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmulateUserResponse>> GetEmulatedUser()
    {
        var key = CacheKeys.EmulatedUser(User.ClientKey(), User.ContactId());

        var emulatedUser = await _cache.GetDataAsync<EmulatedUser>(key);
        if (emulatedUser is null) 
            return Ok(new EmulateUserResponse(0, false));

        return Ok(new EmulateUserResponse(emulatedUser.ContactId, emulatedUser.IsEmulatedUser));
    }

    [Authorize]
    [HttpDelete("emulate-user")] //auth/emulate-user  
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> StopEmulatingUser()
    {
        var key = CacheKeys.EmulatedUser(User.ClientKey(), User.ContactId());
        await _cache.RemoveAsync(key);

        return Ok();
    }
}