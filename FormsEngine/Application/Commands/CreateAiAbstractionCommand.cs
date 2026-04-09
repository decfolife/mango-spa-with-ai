using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Common.Contracts.HTTP.Microservice;
using Common.Enums;
using Dapper;
using FormsEngine.Application.Common.Interfaces;
using Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace FormsEngine.Application.Commands;

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

    // ── File uploads ─────────────────────────────────────────────────────────
    public List<IFormFile> Files { get; set; } = new();
}

public class CreateAiAbstractionCommandHandler : IRequestHandler<CreateAiAbstractionCommand, ApiResponse>
{
    readonly IClientsDbConnectionProvider _dbProvider;
    readonly ILogDirectService _logger;
    readonly ICurrentUserService _currentUserService;
    readonly IConfiguration _configuration;

    public CreateAiAbstractionCommandHandler(
        IClientsDbConnectionProvider dbProvider,
        ILogDirectService logger,
        ICurrentUserService currentUserService,
        IConfiguration configuration)
    {
        _dbProvider = dbProvider;
        _logger = logger;
        _currentUserService = currentUserService;
        _configuration = configuration;
    }

    public async Task<ApiResponse> Handle(CreateAiAbstractionCommand request, CancellationToken cancellationToken)
    {
        if (request.BuildingId <= 0)
            return new ApiResponse(false, "BuildingId is required.");

        if (request.Files == null || request.Files.Count == 0)
            return new ApiResponse(false, "At least one lease document is required.");

        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        try
        {
            var inputJson = JsonSerializer.Serialize(new
            {
                request.BuildingId,
                request.PortfolioId,
                request.PremiseId,
                request.PremiseTypeId,
                request.NewPremiseName,
                request.LeaseTemplateId,
                request.AccountingType,
                request.MeasurementUnitId,
                request.ParentLeaseId,
                request.IncludesAmendments,
                request.AbstractionNotes,
            });

            var abstractionId = await connection.ExecuteScalarAsync<int>(
                "spCreateAiAbstraction",
                new
                {
                    BuildingId = request.BuildingId,
                    CreatedByUserId = _currentUserService.UserId,
                    InputJson = inputJson,
                },
                commandType: CommandType.StoredProcedure);

            var basePath = _configuration["FileStorage:AiDocumentsBasePath"] ?? Path.GetTempPath();

            for (int i = 0; i < request.Files.Count; i++)
            {
                var file = request.Files[i];
                try
                {
                    var folder = Path.Combine(basePath, abstractionId.ToString());
                    Directory.CreateDirectory(folder);
                    var storedName = $"{DateTimeOffset.UtcNow:yyyyMMddHHmmss}_{i}_{file.FileName}";
                    var fullPath = Path.Combine(folder, storedName);

                    await using var stream = File.Create(fullPath);
                    await file.CopyToAsync(stream, cancellationToken);

                    await connection.ExecuteAsync(
                        "spAddAiAbstractionDocument",
                        new
                        {
                            AbstractionId = abstractionId,
                            OriginalFileName = file.FileName,
                            StoredFileName = storedName,
                            ShareFolderPath = folder,
                            FileSizeBytes = file.Length,
                            MimeType = file.ContentType,
                            SortOrder = i,
                            UploadedByUserId = _currentUserService.UserId,
                        },
                        commandType: CommandType.StoredProcedure);
                }
                catch (Exception ex)
                {
                    string fileError = $"AiAbstractions: Failed to save document {file.FileName} for abstraction {abstractionId}. Error: {ex.Message}, Stack Trace: {ex.StackTrace}";
                    await _logger.LogToProcessLogEntries((int)ProcessLogType.Mango, _currentUserService.ClientKey, Environment.MachineName, "F", fileError, _currentUserService.UserId);
                    // Continue — partial upload is acceptable
                }
            }

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
