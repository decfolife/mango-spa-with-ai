namespace Mango.MangoSPA;

/// <summary>
/// Class that represents the 'AppSettings' section in the appsettings.json file.
/// </summary>
public class AppSettings
{
    public const string Section = "AppSettings";

    public string ApplicationName { get; set; }
    public string Environment { get; set; }
    public bool IsInKubernetes { get; set; }
    public bool EnableCaching { get; set; }
    public bool UseInMemoryCaching { get; set; }
}

public class ServiceUrlsOptions
{
    public const string Section = "ServiceUrls";

    public string IdentityApiUrl { get; set; }
}

public class RedisOptions
{
    public const string Section = "Redis";

    public string Connection { get; set; }
    public int Port { get; set; }
    public string Instance { get; set; }
    public string Token { get; set; }
    public bool UseSSL { get; set; }
}

public class RateLimitOptions
{
    public const string Section = "RateLimit";

    public int WindowInSeconds { get; set; }
    public int PermitLimit { get; set; }
}