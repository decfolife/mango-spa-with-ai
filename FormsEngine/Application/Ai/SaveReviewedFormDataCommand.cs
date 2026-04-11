using System;
using System.Threading;
using System.Threading.Tasks;
using Common.Contracts.HTTP.Microservice;
using Common.Enums;
using Infrastructure.Services;
using MediatR;

namespace FormsEngine.Application.Ai;

public class SaveReviewedFormDataCommand : IRequest<ApiResponse>
{
    public int AbstractionId { get; set; }
    public string ReviewedFormData { get; set; } = string.Empty;
}

public class SaveReviewedFormDataCommandHandler : IRequestHandler<SaveReviewedFormDataCommand, ApiResponse>
{
    readonly IAiAbstractionService _service;
    readonly ILogDirectService _logger;
    readonly ICurrentUserService _currentUserService;

    public SaveReviewedFormDataCommandHandler(
        IAiAbstractionService service,
        ILogDirectService logger,
        ICurrentUserService currentUserService)
    {
        _service = service;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse> Handle(SaveReviewedFormDataCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _service.SaveReviewedFormDataAsync(request.AbstractionId, request.ReviewedFormData, _currentUserService.UserId);
            return new ApiResponse(true, "Reviewed form data saved.");
        }
        catch (Exception ex)
        {
            string errorMessage = $"AiAbstractions: Exception Occurred, Method -- SaveReviewedFormData, Error Message: {ex.Message}, Inner Exception: {ex.InnerException}, Stack Trace: {ex.StackTrace}";
            await _logger.LogToProcessLogEntries((int)ProcessLogType.Mango, _currentUserService.ClientKey, Environment.MachineName, "F", errorMessage, _currentUserService.UserId);
            return new ApiResponse(false, ex.Message);
        }
    }
}
