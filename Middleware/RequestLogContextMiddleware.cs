using MangoSPA.Services;
using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace MangoSPA.Middleware;

public class RequestLogContextMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLogContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public Task Invoke(HttpContext context, IRequestService requestService)
    {
        using (LogContext.PushProperty("TrackingId", requestService.TrackingId))
        {
            return _next.Invoke(context);
        }
    }
}