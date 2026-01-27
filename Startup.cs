using Mango.MangoSPA;
using MangoSPA.Extensions;
using MangoSPA.Middleware;
using MangoSPA.Models;
using MangoSPA.Services;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Prometheus;
using RedisRateLimiting;
using RedisRateLimiting.AspNetCore;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Json;
using StackExchange.Redis;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Threading.RateLimiting;
using Yarp.ReverseProxy.Transforms;
using static MangoSPA.Constants;

namespace MangoSPA;

public class Startup
{
    public IConfiguration Configuration { get; }
    public IWebHostEnvironment Environment { get; }

    public Startup(IConfiguration configuration, IWebHostEnvironment environment)
    {
        Configuration = configuration;
        Environment = environment;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddRouting(opts =>
        {
            opts.LowercaseUrls = true;
            opts.LowercaseQueryStrings = true;
        });

        services.AddHealthChecks();
        AddSwagger(services);
        services.AddHttpContextAccessor();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddProblemDetails();
        services.AddRequestTimeouts();

        ConnectionMultiplexer redisMultiplexer = null;
        if (!Configuration.UseInMemoryCaching())
        {
            var configOptions = Configuration.RedisConfigurationOptions();
            redisMultiplexer = ConnectionMultiplexer.Connect(configOptions);
        }

        AddLogging(services);
        AddAppSettings(services);
        AddCache(services, Configuration);
        AddAuth(services, Environment);
        AddAddAntiforgery(services, Environment);
        AddDataProtection(services, redisMultiplexer);
        AddServices(services);
        ConfigureOpenTelemetry(services, Configuration, Environment);
        AddRateLimiting(services, redisMultiplexer);

        AddYarp(services);

        // Needed if we want to serve mangoSPA using .NET web server.
        // Setup where the compiled version of our spa application will be, when in production. 
        //services.AddSpaStaticFiles(options =>
        //{
        //    options.RootPath = "Client/dist";
        //});

        services.AddHttpClient("identity-api", (p, c) =>
        {
            c.BaseAddress = new Uri(Configuration["ServicesUrls:IdentityApiUrl"]);
            c.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            var service = p.GetRequiredService<IRequestService>();

            c.DefaultRequestHeaders.Add(Headers.TrackingId, service.TrackingId.ToString());
        }).AddStandardResilienceHandler();

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                if (Environment.IsLocal())
                    policy.SetIsOriginAllowed(_ => true);
                else
                {
                    var origins = Configuration.GetSection("Auth:CorsOrigins").Get<string[]>();
                    policy.WithOrigins(origins)
                          .SetIsOriginAllowedToAllowWildcardSubdomains();
                }

                policy.AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        //services.AddControllers();

        // Antiforgery validation for controllers
        services.AddControllersWithViews(options =>
            options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute()));

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
                                     | ForwardedHeaders.XForwardedProto
                                     | ForwardedHeaders.XForwardedHost;
        });
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IConfiguration config)
    {
        app.UseExceptionHandler();
        app.UseForwardedHeaders();
        app.UsePathBase("/api");

        if (!env.IsStage() && !env.IsProd())
        {
            var isInK8s = config.IsInKubernetes();
            if (isInK8s)
            {
                app.UseSwagger(opt =>
                {
                    opt.PreSerializeFilters.Add((swagger, request) =>
                    {
                        var scheme = request.Host.Port.ToString().Contains("443") ? "https" : "http";
                        var serverUrl = $"{scheme}://{request.Host}/api";

                        swagger.Servers = new List<OpenApiServer> { new() { Url = serverUrl } };
                    });
                });

                app.UseSwaggerUI(opt =>
                {
                    opt.RoutePrefix = "swagger";
                    opt.SwaggerEndpoint("v1/swagger.json", "MangoSPA Server v1");
                });
            }
            else
            {
                app.UseSwagger();
                app.UseSwaggerUI(opt =>
                {
                    opt.SwaggerEndpoint("../swagger/v1/swagger.json", "MangoSPA Server v1");
                });
            }
        }

        // *****
        // Needed if we want to serve mangoSPA using .NET web server.
        // Needed if not using IIS or NGINX server to serve the app
        //app.UseMiddleware<SecurityHeadersMiddleware>();

        //app.UseStaticFiles(); 

        // This will make the application to respond with the index.html and the rest of the assets present on the configured folder (at AddSpaStaticFiles() (wwwroot))
        //if (!env.IsLocal())
        //{
        //    app.UseSpaStaticFiles();
        //}
        // *****

        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseRouting();
        app.UseCors();

        app.UseOpenTelemetryPrometheusScrapingEndpoint();
        app.UseHttpMetrics();

        app.UseAuthentication();
        app.UseMiddleware<RequestLogContextMiddleware>();
        app.UseAuthorization();
        app.UseAntiforgery();

        app.UseRateLimiter();
        app.UseRequestTimeouts();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
            endpoints.MapHealthChecks("/health");
            endpoints.MapMetrics();
            endpoints.MapReverseProxy(proxy =>
            {
                //proxy.UseAntiforgery();

                // Using this instead of UseAntiforgery().
                // Our custom middleware returns problem details and the correct status code 400 bad request
                // Instead of 502 bad gateway
                proxy.UseMiddleware<YarpExceptionHandler>();

                proxy.UseSessionAffinity();
                proxy.UseLoadBalancing();
                proxy.UsePassiveHealthChecks();
            });
        });

        //app.UseSerilogRequestLogging();

        // Needed if we want to serve mangoSPA using .NET web server.
        // Handles all still unattended (by any other middleware) requests by returning the default page of the SPA (wwwroot/index.html).
        //app.UseSpa(spa =>
        //{
        //    // To learn more about options for serving an Angular SPA from ASP.NET Core,
        //    // see https://go.microsoft.com/fwlink/?linkid=864501

        //    // the root of the angular app. (Where the package.json lives)
        //    spa.Options.SourcePath = "Client";

        //    if (env.IsLocal())
        //    {
        //        // use the SpaServices extension method for angular, that will make the application to run "ng serve" for us, when in development.
        //        spa.UseAngularCliServer(npmScript: "start");
        //    }
        //});
    }

    public void AddAppSettings(IServiceCollection services)
    {
        services.Configure<AppSettings>(Configuration.GetSection(AppSettings.Section));
        services.Configure<ServiceUrlsOptions>(Configuration.GetSection(ServiceUrlsOptions.Section));
    }

    public void AddSwagger(IServiceCollection services)
    {
        services.AddSwaggerGen(opts =>
        {
            opts.SwaggerDoc("v1", new OpenApiInfo() { Title = "MangoSPA Server", Description = "Mango SPA backend (BFF).", Version = "v1" });

            string filePath = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
            opts.IncludeXmlComments(filePath, true);
        });
    }

    public void AddLogging(IServiceCollection services)
    {
        var configuration = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft", LogEventLevel.Error)
            .Enrich.FromLogContext()
            .Enrich.WithEnvironmentUserName()
            .Enrich.WithMachineName()
            .Enrich.WithClientIp()
            .Enrich.WithExceptionStackTraceHash()
            .Enrich.WithProperty("EntryPoint", Assembly.GetEntryAssembly()?.GetName().Name)
            .Enrich.WithProperty("Version", Assembly.GetEntryAssembly()?.GetName().Version?.ToString())
            .WriteTo.Console(new JsonFormatter());
            //.WriteTo.Console(LogEventLevel.Information, "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level}] {CorrelationId} - {Message}{NewLine}{Exception}");

        Log.Logger = configuration.CreateLogger();

        Serilog.Debugging.SelfLog.Enable(Console.Error);
        AppDomain.CurrentDomain.ProcessExit += (s, e) => Log.CloseAndFlush();
        services.AddLogging(b => b.AddSerilog(Log.Logger, dispose: true));
    }

    public void AddAuth(IServiceCollection services, IWebHostEnvironment env)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddSingleton<ITicketStore, SessionStore>();

        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, opts =>
                {
                    opts.Cookie.Name = "mango";
                    opts.Cookie.SameSite = env.IsLocal() ? SameSiteMode.None : SameSiteMode.Strict;
                    opts.Cookie.SecurePolicy = env.IsLowerEnvs() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
                    opts.Cookie.HttpOnly = true;
                    opts.ExpireTimeSpan = TimeSpan.FromMinutes(Configuration.CookieExpirationInMinutes());

                    //opts.SlidingExpiration = true;

                    opts.Events = new CookieAuthenticationEvents
                    {
                        OnRedirectToLogin = async (context) =>
                        {
                            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                            context.HttpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        }
                    };
                });

        services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
             .Configure<ITicketStore>((options, store) =>
             {
                 // Enables storing authentication ticket server-side. Authentication cookie now only contains a session ID.
                 options.SessionStore = store;
             });

        services.AddAuthorization(opts =>
        {
            opts.AddPolicy(Policy.FullAccess, policy => policy.RequireAssertion(context =>
                context.User.IsAdmin()));

            opts.AddPolicy(Policy.AdminUserContact, policy => policy.RequireAssertion(context =>
                context.User.IsAdminUserContact() ||
                context.User.IsAdmin()));

            opts.AddPolicy(Policy.SuperUserContact, policy => policy.RequireAssertion(context =>
                context.User.IsSuperUserContact() ||
                context.User.IsAdmin()));

            opts.AddPolicy(Policy.AdminOrSuperUserContact, policy => policy.RequireAssertion(context =>
                context.User.IsAdminOrSuperUserContact() ||
                context.User.IsAdmin()));
        });


        /*
         * NOTE:
         * var token = await context.GetUserAccessTokenAsync();
         * 
             The method GetUserAccessTokenAsync() is an extension method coming from IdentityModel.AspNetCore. 
             It refreshes the access token if it is expired before handing it back to the caller. 
             As part of the refreshing logic the new access token is being saved in the user's authentication session.

            This method will come in handy when we add the below code (OIDC as the default challenge scheme)
            e.g. services.AddOpenIdConnect() instead of AddOAuth()
         */


        //.AddOAuth("central-auth", o =>
        //{
        //    o.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        //    o.ClientId = "mango-spa";
        //    o.ClientSecret = "mango-spa";

        //    //o.AuthorizationEndpoint = "https://identity.dev.crem.aws.dshrp.com/api/oauth/authorize";
        //    //o.TokenEndpoint = "https://identity.dev.crem.aws.dshrp.com/api/oauth/token";
        //    o.AuthorizationEndpoint = "https://localhost:5001/api/oauth/authorize";
        //    o.TokenEndpoint = "https://localhost:5001/api/oauth/token";
        //    o.CallbackPath = "/oauth/custom-cb";
        //    o.UsePkce = true;

        //    // Todo
        //    o.Events.OnCreatingTicket = async ctx =>
        //    {

        //    };
        //});
    }

    public void AddYarp(IServiceCollection services)
    {
        services.AddReverseProxy()
            .LoadFromConfig(Configuration.GetSection("ReverseProxy"))
            .AddTransforms(builderContext =>
            {
                builderContext.AddRequestTransform(async transformContext =>
                {
                    // Antiforgery validation
                    var isGetRequest = transformContext.ProxyRequest.Method.Method.Equals(System.Net.Http.HttpMethod.Get.Method, StringComparison.OrdinalIgnoreCase);
                    if (!isGetRequest)
                    {
                        var antiforgery = transformContext.HttpContext.RequestServices.GetRequiredService<IAntiforgery>();
                        await antiforgery.ValidateRequestAsync(transformContext.HttpContext);
                    }

                    var cache = transformContext.HttpContext.RequestServices.GetRequiredService<ICacheService>();

                    var key = CacheKeys.EmulatedUser(transformContext.HttpContext.User.ClientKey(), transformContext.HttpContext.User.ContactId());
                    var emulatedUser = await cache.GetDataAsync<EmulatedUser>(key);

                    string accessToken = emulatedUser?.AccessToken ?? transformContext.HttpContext.User.AccessToken();

                    transformContext.ProxyRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                });
            });
    }

    public void AddAddAntiforgery(IServiceCollection services, IWebHostEnvironment env)
    {
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-XSRF-TOKEN";
            options.Cookie.SameSite = env.IsLocal() ? SameSiteMode.None : SameSiteMode.Strict;
            options.Cookie.SecurePolicy = env.IsLowerEnvs() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
            options.Cookie.HttpOnly = true;
            options.Cookie.Expiration = TimeSpan.FromMinutes(Configuration.CookieExpirationInMinutes()); // doesnt work
        });
    }

    public void AddServices(IServiceCollection services)
    {
        services.AddScoped<IRequestService>(provider =>
        {
            var httpContext = provider.GetRequiredService<IHttpContextAccessor>();
            var trackingId = httpContext.GetHeaderValue(Headers.TrackingId, Guid.NewGuid());
            httpContext.SetHeaderValue(Headers.TrackingId, trackingId.ToString());

            return new RequestService(trackingId);
        });

        services.AddScoped<ICacheService, CacheService>()
                .AddScoped<ISessionService, SessionService>();
    }

    // Configure data protection to use the same key ring and app identifier persisted to Redis.
    // Needed for production scenarios where we may have multiple instances of this app running
    public void AddDataProtection(IServiceCollection services, ConnectionMultiplexer multiplexer)
    {
        var builder = services.AddDataProtection()
            .SetApplicationName("mangospa_bff");

        if (Configuration.UseInMemoryCaching())
            return;

        builder.PersistKeysToStackExchangeRedis(multiplexer, "dataprotection");     
    }

    public void AddCache(IServiceCollection services, IConfiguration config)
    {
        if (config.UseInMemoryCaching())
        {
            services.AddDistributedMemoryCache();
            return;
        }

        services.AddStackExchangeRedisCache(options =>
        {
            options.ConfigurationOptions = Configuration.RedisConfigurationOptions();
        });
    }

    public static IServiceCollection ConfigureOpenTelemetry(IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        services.AddOpenTelemetry()
            .ConfigureResource(x => x.AddService(config["AppSettings:ApplicationName"]))
            .WithTracing(tracing =>
            {
                tracing.AddAspNetCoreInstrumentation()
                       .AddHttpClientInstrumentation();

                tracing.AddOtlpExporter();
            })
            .WithMetrics(metrics =>
            {
                metrics.AddAspNetCoreInstrumentation()
                       .AddHttpClientInstrumentation()
                       .AddPrometheusExporter();
            });

        return services;
    }

    void AddRateLimiting(IServiceCollection services, ConnectionMultiplexer multiplexer)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            var rateLimitOptions = Configuration.FixedWindowLimiterOptions();

            // Rate Limit Type - Fixed Window
            if (Configuration.UseInMemoryCaching())
            {
                options.AddPolicy("fixed-by-user-and-path", httpContext =>
                {
                    int contactId = httpContext.User.ContactId();
                    var path = httpContext.Request.Path.ToString();

                    return RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: $"{contactId}:{path}",
                        factory: _ => rateLimitOptions);
                });
            } 
            else
            {
                options.AddPolicy("fixed-by-user-and-path", httpContext =>
                {
                    int contactId = httpContext.User.ContactId();
                    var path = httpContext.Request.Path.ToString();

                    return RedisRateLimitPartition.GetFixedWindowRateLimiter(
                        partitionKey: $"{contactId}_{path}",
                        factory: _ => new RedisFixedWindowRateLimiterOptions
                        {
                            ConnectionMultiplexerFactory = () => multiplexer,
                            PermitLimit = rateLimitOptions.PermitLimit,
                            Window = rateLimitOptions.Window
                        });
                });
            }

            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.Headers.RetryAfter = rateLimitOptions.Window.ToString();

                var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Startup>>();
                logger.LogWarning("Rate limit exceeded for {User} | {Client} | {ContactID}",
                    context.HttpContext.User.Email(), context.HttpContext.User.ClientKey(), context.HttpContext.User.ContactId());

                await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Type = "TooManyRequests",
                    Title = "Rate limit exceeded.",
                    Detail = $"Rate limit exceeded. Please try again after {rateLimitOptions.Window.Seconds} seconds"
                }, cancellationToken);
            };
        });
    }
}


