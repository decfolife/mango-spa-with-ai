using Mango.MangoSPA;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using System.Threading.RateLimiting;

namespace MangoSPA.Extensions;

public static class ConfigurationExtensions
{
    public static bool EnableCaching(this IConfiguration config)
    {
        return config.GetSection(AppSettings.Section)
            .GetValue<bool>("EnableCaching");
    }

    public static bool UseInMemoryCaching(this IConfiguration config)
    {
        return config.GetSection(AppSettings.Section)
            .GetValue<bool>("UseInMemoryCaching");
    }

    public static bool IsInKubernetes(this IConfiguration config)
    {
        return config.GetSection(AppSettings.Section)
            .GetValue<bool>("IsInKubernetes");
    }

    public static int CookieExpirationInMinutes(this IConfiguration config)
    {
        return config.GetSection("Auth")
            .GetValue<int>("CookieExpireInMinutes");
    }

    public static ConfigurationOptions RedisConfigurationOptions(this IConfiguration config)
    {
        var redisSettings = config.GetSection(RedisOptions.Section);

        return new ConfigurationOptions
        {
            Ssl = bool.Parse(redisSettings["UseSSL"]),
            EndPoints =
            {
                { redisSettings["Connection"], int.Parse(redisSettings["Port"]) }
            },
            Password = redisSettings["Token"],
            SyncTimeout = 5000,
            AsyncTimeout = 5000,
            ConnectRetry = 5
        };
    }

    public static FixedWindowRateLimiterOptions FixedWindowLimiterOptions(this IConfiguration config)
    {
        var options = config.GetSection(RateLimitOptions.Section);

        return new FixedWindowRateLimiterOptions
        {
            PermitLimit = options.GetValue<int>("PermitLimit"),
            Window = TimeSpan.FromSeconds(options.GetValue<int>("WindowInSeconds"))
        };
    }
}
