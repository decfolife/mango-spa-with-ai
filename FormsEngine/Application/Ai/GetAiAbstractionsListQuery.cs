using System;
using System.Threading;
using System.Threading.Tasks;
using Common.Contracts.HTTP.Microservice;
using Common.Enums;
using Infrastructure.Services;
using MediatR;

namespace FormsEngine.Application.Ai;

public class GetAiAbstractionsListQuery : IRequest<ApiResponse>
{
    public int BuildingId { get; set; }
}

public class GetAiAbstractionsListQueryHandler : IRequestHandler<GetAiAbstractionsListQuery, ApiResponse>
{
    readonly IAiAbstractionService _service;
    readonly ILogDirectService _logger;
    readonly ICurrentUserService _currentUserService;

    public GetAiAbstractionsListQueryHandler(
        IAiAbstractionService service,
        ILogDirectService logger,
        ICurrentUserService currentUserService)
    {
        _service = service;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse> Handle(GetAiAbstractionsListQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var data = await _service.GetAbstractionsListAsync(request.BuildingId);
            return new ApiResponse(true, data);
        }
        catch (Exception ex)
        {
            string errorMessage = $"AiAbstractions: Exception Occurred, Method -- GetAiAbstractionsByBuilding, Error Message: {ex.Message}, Inner Exception: {ex.InnerException}, Stack Trace: {ex.StackTrace}";
            await _logger.LogToProcessLogEntries((int)ProcessLogType.Mango, _currentUserService.ClientKey, Environment.MachineName, "F", errorMessage, _currentUserService.UserId);
            return new ApiResponse(false, ex.Message);
        }
    }
}
