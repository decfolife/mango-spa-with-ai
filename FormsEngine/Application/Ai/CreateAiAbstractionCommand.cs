using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Common.Contracts.HTTP.Microservice;
using Common.Enums;
using Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace FormsEngine.Application.Ai;

public class CreateAiAbstractionCommand : IRequest<ApiResponse>
{
    // ── Core identifiers ────────────────────────────────────────────────────
    public int BuildingId { get; set; }
    public int? PortfolioId { get; set; }
    public int? PremiseId { get; set; }
    public int? PremiseTypeId { get; set; }
    public string? NewPremiseName { get; set; }

    // ── Lease configuration (mirrors Add Lease modal dropdowns) ─────────────
    public int? LeaseTemplateId { get; set; }
    public string? AccountingType { get; set; }
    public int? MeasurementUnitId { get; set; }
    public int? ParentLeaseId { get; set; }

    // ── AI abstraction specific ──────────────────────────────────────────────
    public bool IncludesAmendments { get; set; }
    public string? AbstractionNotes { get; set; }

    // ── File uploads — excluded from InputJson serialization ─────────────────
    [JsonIgnore]
    public List<IFormFile> Files { get; set; } = new();
}

public class CreateAiAbstractionCommandHandler : IRequestHandler<CreateAiAbstractionCommand, ApiResponse>
{
    readonly IAiAbstractionService _service;
    readonly ILogDirectService _logger;
    readonly ICurrentUserService _currentUserService;

    public CreateAiAbstractionCommandHandler(
        IAiAbstractionService service,
        ILogDirectService logger,
        ICurrentUserService currentUserService)
    {
        _service = service;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse> Handle(CreateAiAbstractionCommand request, CancellationToken cancellationToken)
    {
        if (request.BuildingId <= 0)
            return new ApiResponse(false, "BuildingId is required.");

        if (request.Files == null || request.Files.Count == 0)
            return new ApiResponse(false, "At least one lease document is required.");

        try
        {
            var abstractionId = await _service.CreateAbstractionAsync(request, _currentUserService.UserId, cancellationToken);
            return new ApiResponse(true, new { AbstractionId = abstractionId });
        }
        catch (Exception ex)
        {
            string errorMessage = $"AiAbstractions: Exception Occurred, Method -- CreateAiAbstraction, Error Message: {ex.Message}, Inner Exception: {ex.InnerException}, Stack Trace: {ex.StackTrace}";
            await _logger.LogToProcessLogEntries((int)ProcessLogType.Mango, _currentUserService.ClientKey, Environment.MachineName, "F", errorMessage, _currentUserService.UserId);
            return new ApiResponse(false, ex.Message);
        }
    }
}
