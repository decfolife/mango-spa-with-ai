using System;
using System.Threading;
using System.Threading.Tasks;
using Common.Contracts.HTTP.Microservice;
using Common.Enums;
using Infrastructure.Services;
using MediatR;

namespace FormsEngine.Application.Ai;

public class GetAiAbstractionQuery : IRequest<ApiResponse>
{
    public int AbstractionId { get; set; }
}

public class GetAiAbstractionQueryHandler : IRequestHandler<GetAiAbstractionQuery, ApiResponse>
{
    readonly IAiAbstractionService _service;
    readonly ILogDirectService _logger;
    readonly ICurrentUserService _currentUserService;

    public GetAiAbstractionQueryHandler(
        IAiAbstractionService service,
        ILogDirectService logger,
        ICurrentUserService currentUserService)
    {
        _service = service;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse> Handle(GetAiAbstractionQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var data = await _service.GetAbstractionAsync(request.AbstractionId);
            if (data is null)
                return new ApiResponse(false, "Abstraction not found.");

            return new ApiResponse(true, data);
        }
        catch (Exception ex)
        {
            string errorMessage = $"AiAbstractions: Exception Occurred, Method -- GetAiAbstractionById, Error Message: {ex.Message}, Inner Exception: {ex.InnerException}, Stack Trace: {ex.StackTrace}";
            await _logger.LogToProcessLogEntries((int)ProcessLogType.Mango, _currentUserService.ClientKey, Environment.MachineName, "F", errorMessage, _currentUserService.UserId);
            return new ApiResponse(false, ex.Message);
        }
    }
}
