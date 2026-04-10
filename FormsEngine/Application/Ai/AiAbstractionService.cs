using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace FormsEngine.Application.Ai;

public interface IAiAbstractionService
{
    Task<int> CreateAbstractionAsync(CreateAiAbstractionCommand command, int userId, CancellationToken cancellationToken);
    Task<dynamic?> GetAbstractionAsync(int abstractionId);
    Task<IEnumerable<dynamic>> GetAbstractionsListAsync(int buildingId);
}

public class AiAbstractionService : IAiAbstractionService
{
    readonly IAiAbstractionRepository _repository;
    readonly IAiProvider _aiProvider;
    readonly IConfiguration _configuration;

    public AiAbstractionService(IAiAbstractionRepository repository, IAiProvider aiProvider, IConfiguration configuration)
    {
        _repository = repository;
        _aiProvider  = aiProvider;
        _configuration = configuration;
    }

    public async Task<int> CreateAbstractionAsync(CreateAiAbstractionCommand command, int userId, CancellationToken cancellationToken)
    {
        var inputJson = JsonSerializer.Serialize(command);

        var abstractionId = await _repository.CreateAsync(command, userId, inputJson);

        await SaveDocumentsAsync(abstractionId, command.Files, userId, cancellationToken);

        // Process with AI (fire-and-forget so the HTTP response returns immediately)
        _ = ProcessWithAiAsync(abstractionId, inputJson, userId);

        return abstractionId;
    }

    public Task<dynamic?> GetAbstractionAsync(int abstractionId)
        => _repository.GetByIdAsync(abstractionId);

    public Task<IEnumerable<dynamic>> GetAbstractionsListAsync(int buildingId)
        => _repository.GetListAsync(buildingId);

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task ProcessWithAiAsync(int abstractionId, string inputJson, int userId)
    {
        try
        {
            await _repository.SetStatusAsync(abstractionId, "Processing", userId);

            var aiOutputJson = await _aiProvider.ProcessAsync(inputJson, CancellationToken.None);

            // Extract top-level fields to promote into indexed columns
            string? aiTenant = null;
            DateTime? aiLeaseEndDate = null;

            try
            {
                using var doc = JsonDocument.Parse(aiOutputJson);
                if (doc.RootElement.TryGetProperty("basics", out var basics) &&
                    basics.TryGetProperty("tenant", out var tenantEl) &&
                    tenantEl.TryGetProperty("value", out var tenantVal))
                {
                    aiTenant = tenantVal.GetString();
                }

                if (doc.RootElement.TryGetProperty("dates", out var dates) &&
                    dates.TryGetProperty("leaseEndDate", out var endDateEl) &&
                    endDateEl.TryGetProperty("value", out var endDateVal) &&
                    DateTime.TryParse(endDateVal.GetString(), out var parsed))
                {
                    aiLeaseEndDate = parsed;
                }
            }
            catch { /* promotion is best-effort */ }

            await _repository.CompleteAsync(abstractionId, aiOutputJson, aiTenant, aiLeaseEndDate, userId);
        }
        catch (Exception ex)
        {
            await _repository.SetErrorAsync(abstractionId, ex.Message, userId);
        }
    }

    private async Task SaveDocumentsAsync(int abstractionId, List<IFormFile> files, int userId, CancellationToken cancellationToken)
    {
        var basePath = _configuration["FileStorage:AiDocumentsBasePath"] ?? Path.GetTempPath();
        var folder = Path.Combine(basePath, abstractionId.ToString());
        Directory.CreateDirectory(folder);

        for (int i = 0; i < files.Count; i++)
        {
            var file = files[i];
            var storedName = $"{DateTimeOffset.UtcNow:yyyyMMddHHmmss}_{i}_{file.FileName}";
            var fullPath = Path.Combine(folder, storedName);

            await using var stream = File.Create(fullPath);
            await file.CopyToAsync(stream, cancellationToken);

            await _repository.AddDocumentAsync(
                abstractionId,
                originalFileName: file.FileName,
                storedFileName: storedName,
                shareFolderPath: folder,
                fileSizeBytes: file.Length,
                mimeType: file.ContentType,
                sortOrder: i,
                userId: userId);
        }
    }
}
