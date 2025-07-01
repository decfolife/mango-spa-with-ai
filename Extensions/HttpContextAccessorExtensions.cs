using Microsoft.AspNetCore.Http;
using System.Text.Json;

namespace MangoSPA.Extensions;

public static class HttpContextAccessorExtensions
{
    public static T GetHeaderValue<T>(this IHttpContextAccessor service, string key, T defaultValue = default)
    {
        string value = service.HttpContext?.Request?.Headers[key].ToString();

        return string.IsNullOrWhiteSpace(value) ? defaultValue : JsonSerializer.Deserialize<T>(value);
    }

    public static string GetHeaderValue(this IHttpContextAccessor service, string key, string defaultValue = "")
    {
        string value = service.HttpContext?.Request?.Headers[key].ToString();
        return string.IsNullOrWhiteSpace(value) ? defaultValue : value;
    }

    public static Guid GetHeaderValue(this IHttpContextAccessor context, string key, Guid defaultValue)
    {
        Guid.TryParse(context.GetHeaderValue(key, defaultValue.ToString()), out defaultValue);
        return defaultValue;
    }

    public static void SetHeaderValue(this IHttpContextAccessor context, string key, string value)
    {
        var request = context.HttpContext?.Request;

        if (request?.Headers.ContainsKey(key) ?? false)
            request?.Headers.Remove(key);

        request?.Headers.Add(key, value);
    }
}
