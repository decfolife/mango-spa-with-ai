using System.Threading.Tasks;
using Dapper;
using FormsEngine.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;

namespace FormsEngine.Application.Ai;

public interface IAiAbstractionRepository
{
    Task<int> CreateAsync(int buildingId, int userId, string inputJson);
    Task AddDocumentAsync(int abstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int userId);
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

    public async Task<int> CreateAsync(int buildingId, int userId, string inputJson)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.ExecuteScalarAsync<int>(
            """
            INSERT INTO dbo.AILeaseAbstractions
                (BuildingID, InputJson, CreatedBy, CreatedDate, LastModifiedBy, LastModifiedDate)
            OUTPUT INSERTED.AbstractionID
            VALUES
                (@BuildingId, @InputJson, @UserId, GETUTCDATE(), @UserId, GETUTCDATE())
            """,
            new { BuildingId = buildingId, InputJson = inputJson, UserId = userId });
    }

    public async Task AddDocumentAsync(int abstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int userId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.AIAbstractionDocuments
                (AbstractionID, OriginalFileName, StoredFileName, ShareFolderPath,
                 FileSizeBytes, MimeType, SortOrder,
                 CreatedBy, CreatedDate, LastModifiedBy, LastModifiedDate)
            VALUES
                (@AbstractionId, @OriginalFileName, @StoredFileName, @ShareFolderPath,
                 @FileSizeBytes, @MimeType, @SortOrder,
                 @UserId, GETUTCDATE(), @UserId, GETUTCDATE())
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
                UserId = userId,
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
                AIOutputJson     AS AiOutputJson,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate,
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
                AI_Tenant        AS AiTenant,
                AI_LeaseEndDate  AS AiLeaseEndDate,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate
            FROM dbo.AILeaseAbstractions
            WHERE BuildingID = @BuildingId
              AND [Status] <> 'Cancelled'
            ORDER BY CreatedDate DESC
            """,
            new { BuildingId = buildingId });
    }
}
