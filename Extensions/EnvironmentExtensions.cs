using Microsoft.AspNetCore.Hosting;

namespace MangoSPA.Extensions;

public static class EnvironmentExtensions
{
    public static bool IsLocal(this IWebHostEnvironment env)
    {
        return env.EnvironmentName.Equals(Environments.Local, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsDev(this IWebHostEnvironment env)
    {
        return env.EnvironmentName.Equals(Environments.Development, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsTest(this IWebHostEnvironment env)
    {
        return env.EnvironmentName.Equals(Environments.Testing, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsOps(this IWebHostEnvironment env)
    {
        return env.EnvironmentName.Equals(Environments.Ops, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsStage(this IWebHostEnvironment env)
    {
        return env.EnvironmentName.Equals(Environments.Staging, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsProd(this IWebHostEnvironment env)
    {
        return env.EnvironmentName.Equals(Environments.Production, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsLowerEnvs(this IWebHostEnvironment env)
    {
        return env.IsLocal() || env.IsDev() || env.IsTest() || env.IsOps();
    }

    public static bool IsUpperEnvs(this IWebHostEnvironment env)
    {
        return env.IsStage() || env.IsProd();
    }

    public static bool IsSwaggerEnabled(this IWebHostEnvironment env)
    {
        List<string> swaggerEnabledEnvs = new()
        {
            Environments.Local,
            Environments.Development,
            Environments.Testing
        };
        return swaggerEnabledEnvs.Contains(env.EnvironmentName.ToUpper());
    }
}

public static class Environments
{
    public const string Local = "LOCAL";
    public const string Development = "DEV";
    public const string Testing = "TEST";
    public const string Ops = "OPS";
    public const string Staging = "STAGE";
    public const string Production = "PROD";
}
