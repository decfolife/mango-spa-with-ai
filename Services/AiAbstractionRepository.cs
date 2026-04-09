using Dapper;
using MangoSPA.Models.Ai;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace MangoSPA.Services;

public interface IAiAbstractionRepository
{
    Task<int> CreateAsync(string inputJson, int buildingId, int createdByUserId, CancellationToken ct = default);
    Task AddDocumentAsync(int abstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder,
        int uploadedByUserId, CancellationToken ct = default);
    Task<AiAbstractionDetail?> GetByIdAsync(int abstractionId, CancellationToken ct = default);
    Task<IReadOnlyList<AiAbstractionListItem>> GetListAsync(int buildingId, CancellationToken ct = default);
}

public class AiAbstractionRepository : IAiAbstractionRepository
{
    private readonly string _connectionString;

    public AiAbstractionRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("AiDatabase")
            ?? throw new InvalidOperationException("Connection string 'AiDatabase' is not configured.");
    }

    public async Task<int> CreateAsync(string inputJson, int buildingId, int createdByUserId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO dbo.AILeaseAbstractions (BuildingID, CreatedByUserID, InputJson)
            OUTPUT INSERTED.AbstractionID
            VALUES (@BuildingId, @CreatedByUserId, @InputJson)
            """;

        using var conn = new SqlConnection(_connectionString);
        var cmd = new CommandDefinition(sql, new { BuildingId = buildingId, CreatedByUserId = createdByUserId, InputJson = inputJson }, cancellationToken: ct);
        return await conn.ExecuteScalarAsync<int>(cmd);
    }

    public async Task AddDocumentAsync(int abstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder,
        int uploadedByUserId, CancellationToken ct = default)
    {
        const string sql = """
            INSERT INTO dbo.AIAbstractionDocuments
                (AbstractionID, OriginalFileName, StoredFileName, ShareFolderPath, FileSizeBytes, MimeType, SortOrder, UploadedByUserID)
            VALUES
                (@AbstractionId, @OriginalFileName, @StoredFileName, @ShareFolderPath, @FileSizeBytes, @MimeType, @SortOrder, @UploadedByUserId)
            """;

        using var conn = new SqlConnection(_connectionString);
        var cmd = new CommandDefinition(sql, new
        {
            AbstractionId = abstractionId,
            OriginalFileName = originalFileName,
            StoredFileName = storedFileName,
            ShareFolderPath = shareFolderPath,
            FileSizeBytes = fileSizeBytes,
            MimeType = mimeType,
            SortOrder = sortOrder,
            UploadedByUserId = uploadedByUserId,
        }, cancellationToken: ct);

        await conn.ExecuteAsync(cmd);
    }

    public async Task<AiAbstractionDetail?> GetByIdAsync(int abstractionId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                AbstractionID,
                BuildingID,
                [Status],
                ErrorMessage,
                InputJson,
                AIOutputJson AS AiOutputJson,
                CreatedDate,
                CompletedDate
            FROM dbo.AILeaseAbstractions
            WHERE AbstractionID = @AbstractionId
            """;

        using var conn = new SqlConnection(_connectionString);
        var cmd = new CommandDefinition(sql, new { AbstractionId = abstractionId }, cancellationToken: ct);
        return await conn.QueryFirstOrDefaultAsync<AiAbstractionDetail>(cmd);
    }

    public async Task<IReadOnlyList<AiAbstractionListItem>> GetListAsync(int buildingId, CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                AbstractionID,
                BuildingID,
                [Status],
                AI_Tenant        AS AiTenant,
                AI_LeaseEndDate  AS AiLeaseEndDate,
                CreatedDate
            FROM dbo.AILeaseAbstractions
            WHERE BuildingID = @BuildingId
              AND [Status] <> 'Cancelled'
            ORDER BY CreatedDate DESC
            """;

        using var conn = new SqlConnection(_connectionString);
        var cmd = new CommandDefinition(sql, new { BuildingId = buildingId }, cancellationToken: ct);
        var rows = await conn.QueryAsync<AiAbstractionListItem>(cmd);
        return rows.ToList();
    }
}
