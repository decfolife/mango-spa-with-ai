using System.Threading.Tasks;
using Dapper;
using FormsEngine.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;

namespace FormsEngine.Application.Ai;

public interface IAiAbstractionRepository
{
    Task<int> CreateAsync(int buildingId, int createdByUserId, string inputJson);
    Task AddDocumentAsync(int abstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int uploadedByUserId);
    Task<dynamic?> GetByIdAsync(int abstractionId);
    Task<IEnumerable<dynamic>> GetListAsync(int buildingId);
}

public class AiAbstractionRepository : IAiAbstractionRepository
{
    readonly IClientsDbConnectionProvider _dbProvider;

    public AiAbstractionRepository(IClientsDbConnectionProvider dbProvider)
    {
        _dbProvider = dbProvider;
    }

    public async Task<int> CreateAsync(int buildingId, int createdByUserId, string inputJson)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.ExecuteScalarAsync<int>(
            """
            INSERT INTO dbo.AILeaseAbstractions (BuildingID, CreatedByUserID, InputJson)
            OUTPUT INSERTED.AbstractionID
            VALUES (@BuildingId, @CreatedByUserId, @InputJson)
            """,
            new { BuildingId = buildingId, CreatedByUserId = createdByUserId, InputJson = inputJson });
    }

    public async Task AddDocumentAsync(int abstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int uploadedByUserId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.AIAbstractionDocuments
                (AbstractionID, OriginalFileName, StoredFileName, ShareFolderPath, FileSizeBytes, MimeType, SortOrder, UploadedByUserID)
            VALUES
                (@AbstractionId, @OriginalFileName, @StoredFileName, @ShareFolderPath, @FileSizeBytes, @MimeType, @SortOrder, @UploadedByUserId)
            """,
            new
            {
                AbstractionId = abstractionId,
                OriginalFileName = originalFileName,
                StoredFileName = storedFileName,
                ShareFolderPath = shareFolderPath,
                FileSizeBytes = fileSizeBytes,
                MimeType = mimeType,
                SortOrder = sortOrder,
                UploadedByUserId = uploadedByUserId,
            });
    }

    public async Task<dynamic?> GetByIdAsync(int abstractionId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.QueryFirstOrDefaultAsync(
            """
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
            """,
            new { AbstractionId = abstractionId });
    }

    public async Task<IEnumerable<dynamic>> GetListAsync(int buildingId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.QueryAsync(
            """
            SELECT
                AbstractionID,
                BuildingID,
                [Status],
                AI_Tenant       AS AiTenant,
                AI_LeaseEndDate AS AiLeaseEndDate,
                CreatedDate
            FROM dbo.AILeaseAbstractions
            WHERE BuildingID = @BuildingId
              AND [Status] <> 'Cancelled'
            ORDER BY CreatedDate DESC
            """,
            new { BuildingId = buildingId });
    }
}
