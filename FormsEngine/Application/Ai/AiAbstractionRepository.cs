using System;
using System.Threading.Tasks;
using Dapper;
using FormsEngine.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;

namespace FormsEngine.Application.Ai;

public interface IAiAbstractionRepository
{
    Task<int> CreateAsync(CreateAiAbstractionCommand command, int userId, string contextJson);
    Task AddDocumentAsync(int aiAbstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int userId);
    Task SetStatusAsync(int aiAbstractionId, string status, int userId);
    Task CompleteAsync(int aiAbstractionId, string aiOutputJson, string? aiTenant, DateTime? aiLeaseEndDate, int userId);
    Task SetErrorAsync(int aiAbstractionId, string errorMessage, int userId);
    Task SaveReviewedFormDataAsync(int aiAbstractionId, string reviewedFormData, int userId);
    Task<dynamic?> GetByIdAsync(int aiAbstractionId);
    Task<IEnumerable<dynamic>> GetListAsync(int buildingId);
}

public class AiAbstractionRepository : IAiAbstractionRepository
{
    readonly IClientsDbConnectionProvider _dbProvider;

    public AiAbstractionRepository(IClientsDbConnectionProvider dbProvider)
    {
        _dbProvider = dbProvider;
    }

    public async Task<int> CreateAsync(CreateAiAbstractionCommand command, int userId, string contextJson)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.ExecuteScalarAsync<int>(
            """
            INSERT INTO dbo.tblAiAbstractionLeases (
                BuildingID,
                ContextJson,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate
            )
            OUTPUT INSERTED.AiAbstractionID
            VALUES (
                @BuildingId,
                @ContextJson,
                @UserId,
                GETUTCDATE(),
                @UserId,
                GETUTCDATE()
            )
            """,
            new
            {
                BuildingId  = command.BuildingId,
                ContextJson = contextJson,
                UserId      = userId,
            });
    }

    public async Task AddDocumentAsync(int aiAbstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int userId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.tblAiAbstractionDocuments
                (AiAbstractionID, OriginalFileName, StoredFileName, ShareFolderPath,
                 FileSizeBytes, MimeType, SortOrder,
                 CreatedBy, CreatedDate, LastModifiedBy, LastModifiedDate)
            VALUES
                (@AiAbstractionId, @OriginalFileName, @StoredFileName, @ShareFolderPath,
                 @FileSizeBytes, @MimeType, @SortOrder,
                 @UserId, GETUTCDATE(), @UserId, GETUTCDATE())
            """,
            new
            {
                AiAbstractionId  = aiAbstractionId,
                OriginalFileName = originalFileName,
                StoredFileName   = storedFileName,
                ShareFolderPath  = shareFolderPath,
                FileSizeBytes    = fileSizeBytes,
                MimeType         = mimeType,
                SortOrder        = sortOrder,
                UserId           = userId,
            });
    }

    public async Task SetStatusAsync(int aiAbstractionId, string status, int userId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            UPDATE dbo.tblAiAbstractionLeases
            SET    [Status]         = @Status,
                   LastModifiedBy   = @UserId,
                   LastModifiedDate = GETUTCDATE()
            WHERE  AiAbstractionID = @AiAbstractionId
            """,
            new { AiAbstractionId = aiAbstractionId, Status = status, UserId = userId });
    }

    public async Task CompleteAsync(int aiAbstractionId, string aiOutputJson, string? aiTenant, DateTime? aiLeaseEndDate, int userId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            UPDATE dbo.tblAiAbstractionLeases
            SET    [Status]         = 'Complete',
                   AIOutputJson     = @AiOutputJson,
                   AI_Tenant        = @AiTenant,
                   AI_LeaseEndDate  = @AiLeaseEndDate,
                   CompletedDate    = GETUTCDATE(),
                   LastModifiedBy   = @UserId,
                   LastModifiedDate = GETUTCDATE()
            WHERE  AiAbstractionID = @AiAbstractionId
            """,
            new { AiAbstractionId = aiAbstractionId, AiOutputJson = aiOutputJson, AiTenant = aiTenant, AiLeaseEndDate = aiLeaseEndDate, UserId = userId });
    }

    public async Task SetErrorAsync(int aiAbstractionId, string errorMessage, int userId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            UPDATE dbo.tblAiAbstractionLeases
            SET    [Status]         = 'Error',
                   ErrorMessage     = @ErrorMessage,
                   LastModifiedBy   = @UserId,
                   LastModifiedDate = GETUTCDATE()
            WHERE  AiAbstractionID = @AiAbstractionId
            """,
            new { AiAbstractionId = aiAbstractionId, ErrorMessage = errorMessage, UserId = userId });
    }

    public async Task SaveReviewedFormDataAsync(int aiAbstractionId, string reviewedFormData, int userId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            UPDATE dbo.tblAiAbstractionLeases
            SET    ReviewedFormData  = @ReviewedFormData,
                   LastModifiedBy   = @UserId,
                   LastModifiedDate = GETUTCDATE()
            WHERE  AiAbstractionID = @AiAbstractionId
            """,
            new { AiAbstractionId = aiAbstractionId, ReviewedFormData = reviewedFormData, UserId = userId });
    }

    public async Task<dynamic?> GetByIdAsync(int aiAbstractionId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.QueryFirstOrDefaultAsync(
            """
            SELECT
                AiAbstractionID,
                BuildingID,
                [Status],
                CompletedDate,
                ErrorMessage,
                ContextJson,
                AIOutputJson     AS AiOutputJson,
                AI_Tenant        AS AiTenant,
                AI_LeaseEndDate  AS AiLeaseEndDate,
                ReviewedFormData,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate
            FROM dbo.tblAiAbstractionLeases
            WHERE AiAbstractionID = @AiAbstractionId
            """,
            new { AiAbstractionId = aiAbstractionId });
    }

    public async Task<IEnumerable<dynamic>> GetListAsync(int buildingId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.QueryAsync(
            """
            SELECT
                AiAbstractionID,
                BuildingID,
                [Status],
                CompletedDate,
                AI_Tenant        AS AiTenant,
                AI_LeaseEndDate  AS AiLeaseEndDate,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate
            FROM dbo.tblAiAbstractionLeases
            WHERE BuildingID = @BuildingId
              AND [Status] <> 'Cancelled'
            ORDER BY CreatedDate DESC
            """,
            new { BuildingId = buildingId });
    }
}
