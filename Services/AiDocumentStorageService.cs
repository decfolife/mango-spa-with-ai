using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace MangoSPA.Services;

public interface IAiDocumentStorageService
{
    /// <summary>
    /// Saves the file to the configured share path under the given abstractionId sub-folder.
    /// Returns (storedFileName, fullPath).
    /// </summary>
    Task<(string storedFileName, string shareFolderPath)> SaveAsync(
        int abstractionId, IFormFile file, int sortOrder, CancellationToken ct = default);
}

public class AiDocumentStorageService : IAiDocumentStorageService
{
    private readonly string _basePath;

    public AiDocumentStorageService(IConfiguration configuration)
    {
        _basePath = configuration["FileStorage:AiDocumentsBasePath"]
            ?? throw new InvalidOperationException("FileStorage:AiDocumentsBasePath is not configured.");
    }

    public async Task<(string storedFileName, string shareFolderPath)> SaveAsync(
        int abstractionId, IFormFile file, int sortOrder, CancellationToken ct = default)
    {
        // Folder per abstraction: {basePath}/{abstractionId}/
        var folderPath = Path.Combine(_basePath, abstractionId.ToString());
        Directory.CreateDirectory(folderPath);

        // Unique file name to prevent collisions: {timestamp}_{sortOrder}_{originalName}
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
        var safeOriginalName = Path.GetFileName(file.FileName); // strip any path components
        var storedFileName = $"{timestamp}_{sortOrder}_{safeOriginalName}";
        var fullPath = Path.Combine(folderPath, storedFileName);

        await using var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await file.CopyToAsync(stream, ct);

        return (storedFileName, folderPath);
    }
}
