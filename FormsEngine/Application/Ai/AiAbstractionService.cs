using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FormsEngine.Application.Ai;

public interface IAiAbstractionService
{
    Task<int> CreateAbstractionAsync(CreateAiAbstractionCommand command, int userId, CancellationToken cancellationToken);
    Task<AiAbstractionRecord?> GetAbstractionAsync(int aiAbstractionId);
    Task<IEnumerable<AiAbstractionRecord>> GetAbstractionsListAsync(int buildingId);
    Task SaveReviewedFormDataAsync(int aiAbstractionId, string reviewedFormData, int userId);
}

public class AiAbstractionService : IAiAbstractionService
{
    readonly IAiAbstractionRepository _repository;
    readonly IAiProvider              _aiProvider;
    readonly IConfiguration           _configuration;
    readonly IServiceScopeFactory     _scopeFactory;

    public AiAbstractionService(
        IAiAbstractionRepository repository,
        IAiProvider              aiProvider,
        IConfiguration           configuration,
        IServiceScopeFactory     scopeFactory)
    {
        _repository    = repository;
        _aiProvider    = aiProvider;
        _configuration = configuration;
        _scopeFactory  = scopeFactory;
    }

    public async Task<int> CreateAbstractionAsync(CreateAiAbstractionCommand command, int userId, CancellationToken cancellationToken)
    {
        // Serialise the modal context inputs (portfolio, premise, template, etc.)
        var contextJson = JsonSerializer.Serialize(command);

        var aiAbstractionId = await _repository.CreateAsync(command, userId, contextJson);

        await SaveDocumentsAsync(aiAbstractionId, command.Files, userId, cancellationToken);

        // Fire-and-forget: AI processing runs in the background; response returns immediately
        _ = ProcessWithAiAsync(aiAbstractionId, contextJson, userId);

        return aiAbstractionId;
    }

    public Task<AiAbstractionRecord?> GetAbstractionAsync(int aiAbstractionId)
        => _repository.GetByIdAsync(aiAbstractionId);

    public Task<IEnumerable<AiAbstractionRecord>> GetAbstractionsListAsync(int buildingId)
        => _repository.GetListAsync(buildingId);

    public Task SaveReviewedFormDataAsync(int aiAbstractionId, string reviewedFormData, int userId)
        => _repository.SaveReviewedFormDataAsync(aiAbstractionId, reviewedFormData, userId);

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task ProcessWithAiAsync(int aiAbstractionId, string contextJson, int userId)
    {
        // The originating HTTP request has already returned, so its DI scope is gone.
        // Create a fresh scope so the repository's DB connection provider is still valid.
        await using var scope = _scopeFactory.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<IAiAbstractionRepository>();

        try
        {
            await repository.SetStatusAsync(aiAbstractionId, "Processing", userId);

            var aiOutputJson = await _aiProvider.ProcessAsync(contextJson, CancellationToken.None);

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

            await repository.CompleteAsync(aiAbstractionId, aiOutputJson, aiTenant, aiLeaseEndDate, userId);
        }
        catch (Exception ex)
        {
            await repository.SetErrorAsync(aiAbstractionId, ex.Message, userId);
        }
    }

    private async Task SaveDocumentsAsync(int aiAbstractionId, List<IFormFile> files, int userId, CancellationToken cancellationToken)
    {
        var basePath = _configuration["FileStorage:AiDocumentsBasePath"] ?? Path.GetTempPath();
        var folder = Path.Combine(basePath, aiAbstractionId.ToString());
        Directory.CreateDirectory(folder);

        for (int i = 0; i < files.Count; i++)
        {
            var file = files[i];
            var storedName = $"{DateTimeOffset.UtcNow:yyyyMMddHHmmss}_{i}_{file.FileName}";
            var fullPath = Path.Combine(folder, storedName);

            await using var stream = File.Create(fullPath);
            await file.CopyToAsync(stream, cancellationToken);

            await _repository.AddDocumentAsync(
                aiAbstractionId,
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
