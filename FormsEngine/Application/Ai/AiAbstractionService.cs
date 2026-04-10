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
    readonly IConfiguration _configuration;

    public AiAbstractionService(IAiAbstractionRepository repository, IConfiguration configuration)
    {
        _repository = repository;
        _configuration = configuration;
    }

    public async Task<int> CreateAbstractionAsync(CreateAiAbstractionCommand command, int userId, CancellationToken cancellationToken)
    {
        var inputJson = JsonSerializer.Serialize(command);

        var abstractionId = await _repository.CreateAsync(command.BuildingId, userId, inputJson);

        await SaveDocumentsAsync(abstractionId, command.Files, userId, cancellationToken);

        return abstractionId;
    }

    public Task<dynamic?> GetAbstractionAsync(int abstractionId)
        => _repository.GetByIdAsync(abstractionId);

    public Task<IEnumerable<dynamic>> GetAbstractionsListAsync(int buildingId)
        => _repository.GetListAsync(buildingId);

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
