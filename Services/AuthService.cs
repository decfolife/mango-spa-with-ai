using MangoSPA.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Claims;
using static MangoSPA.Constants;
using System.Net.Http.Headers;
using UAParser;
using MangoSPA.Extensions;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace MangoSPA.Services;

public interface IAuthService
{
    Task<AccessTokenResponse> OAuthToken(AccessTokenRequest request);
    Task<AuthorizeResponse> OAuthAuthorize(string accessToken, string redirectUri);
    Task CreateAuthenticationCookie(string accessToken);
    void CreateCSRFTokenCookie();
    Task<string> GetAccessTokenForEmulatedUser(EmulateUserRequest request);
}

public class AuthService : IAuthService
{
    readonly IHttpClientFactory _clientFactory;
    readonly IHttpContextAccessor _httpContextAccessor;
    readonly IAntiforgery _forgeryService;
    readonly IWebHostEnvironment _env;
    readonly IConfiguration _config;
    readonly ILogger<AuthService> _logger;

    public AuthService(
        IHttpClientFactory clientFactory,
        IHttpContextAccessor httpContextAccessor,
        IAntiforgery forgeryService,
        IWebHostEnvironment env,
        IConfiguration config,
        ILogger<AuthService> logger)
    {
        _clientFactory = clientFactory;
        _httpContextAccessor = httpContextAccessor;
        _forgeryService = forgeryService;
        _env = env;
        _config = config;
        _logger = logger;
    }

    public async Task<AccessTokenResponse> OAuthToken(AccessTokenRequest request)
    {
        var client = _clientFactory.CreateClient("identity-api");

        var response = await client.PostAsJsonAsync("oauth/token", request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("AccessToken request failed. {StatusCode} {Error}", response.IsSuccessStatusCode, error);
            return null;
        }

        var result = await response.Content.ReadFromJsonAsync<AccessTokenResponse>();

        return result;
    }

    public async Task<AuthorizeResponse> OAuthAuthorize(string accessToken, string redirectUri)
    {
        var client = _clientFactory.CreateClient("identity-api");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync($"oauth/authorize?ResponseType=code&ClientId=mango-spa&RedirectUri={redirectUri}");
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Authorize request failed. {StatusCode} {Error}", response.IsSuccessStatusCode, error);
            return null;
        }

        var result = await response.Content.ReadFromJsonAsync<AuthorizeResponse>();

        return result;
    }

    public async Task CreateAuthenticationCookie(string accessToken)
    {
        JwtSecurityToken token = new JwtSecurityTokenHandler().ReadJwtToken(accessToken);
        var claims = new List<Claim>(token.Claims) { new(ClaimType.AccessToken, accessToken) };

        var userIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var userPrincipal = new ClaimsPrincipal(userIdentity);

        var authProps = new AuthenticationProperties { IsPersistent = true };

        var uaParser = Parser.GetDefault();
        ClientInfo c = uaParser.Parse(_httpContextAccessor.HttpContext.Request.Headers.UserAgent);

        authProps.Items.Add("os", c.OS.Family);
        authProps.Items.Add("browser", c.UA.Family);

        await _httpContextAccessor.HttpContext.SignInAsync(userPrincipal, authProps);
    }

    /// <summary>
    /// Creates 2 cookies.
    ///   - Creates and sets the XSRF token in a http-only cookie.
    ///   - Creates a XSRF request token and writes it to a non-http cookie for the client app to use.
    /// </summary>
    public void CreateCSRFTokenCookie()
    {
        // Creates and sets the cookie token in a cookie
        // Cookie name will be like ".AspNetCore.Antiforgery.pG4SaGh5yDI"
        var tokens = _forgeryService.GetAndStoreTokens(_httpContextAccessor.HttpContext);

        // Set another cookie for a request token
        // Angular includes xsrf protection that reads a cookie named XSRF-TOKEN by default.
        _httpContextAccessor.HttpContext.Response.Cookies.Append("XSRF-TOKEN",
            tokens.RequestToken!,
            new CookieOptions
            {
                HttpOnly = false,
                Secure = true,
                SameSite = _env.IsLocal() ? SameSiteMode.None : SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddMinutes(_config.CookieExpirationInMinutes())
            });
    }

    public async Task<string> GetAccessTokenForEmulatedUser(EmulateUserRequest request)
    {
        var client = _clientFactory.CreateClient("identity-api");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _httpContextAccessor.HttpContext.User.AccessToken());

        var response = await client.PostAsJsonAsync("auth/emulate-user", request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("AccessToken request failed for emulated user. {StatusCode} {Error}", response.IsSuccessStatusCode, error);
            return null;
        }

        var result = await response.Content.ReadFromJsonAsync<AccessTokenDto>();

        return result.AuthToken;
    }
}
