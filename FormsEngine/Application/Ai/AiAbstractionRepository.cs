using System;
using System.Threading.Tasks;
using Dapper;
using FormsEngine.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;

namespace FormsEngine.Application.Ai;

/// <summary>
/// Strongly-typed record returned by SELECT queries — avoids dynamic serialisation issues
/// with System.Text.Json.  Dapper maps SQL aliases case-insensitively onto these properties;
/// ASP.NET Core's default camelCase JsonNamingPolicy then serialises them to camelCase JSON.
/// </summary>
public sealed class AiAbstractionRecord
{
    public int       AbstractionId    { get; init; }
    public int       BuildingId       { get; init; }
    public int?      PortfolioId      { get; init; }
    public int?      PremiseId        { get; init; }
    public string    Status           { get; init; } = string.Empty;
    public DateTime? CompletedDate    { get; init; }
    public string?   ErrorMessage     { get; init; }
    public string?   ContextJson      { get; init; }
    public string?   AiOutputJson     { get; init; }
    public string?   AiTenant         { get; init; }
    public DateTime? AiLeaseEndDate   { get; init; }
    public string?   ReviewedFormData { get; init; }
    public int       CreatedBy        { get; init; }
    public DateTime  CreatedDate      { get; init; }
    public int       LastModifiedBy   { get; init; }
    public DateTime  LastModifiedDate { get; init; }
}

public interface IAiAbstractionRepository
{
    Task<int> CreateAsync(CreateAiAbstractionCommand command, int userId, string contextJson);
    Task AddDocumentAsync(int aiAbstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int userId);
    Task SetStatusAsync(int aiAbstractionId, string status, int userId);
    Task CompleteAsync(int aiAbstractionId, string aiOutputJson, string? aiTenant, DateTime? aiLeaseEndDate, int userId);
    Task SetErrorAsync(int aiAbstractionId, string errorMessage, int userId);
    Task SaveReviewedFormDataAsync(int aiAbstractionId, string reviewedFormData, int userId);
    Task<AiAbstractionRecord?> GetByIdAsync(int aiAbstractionId);
    Task<IEnumerable<AiAbstractionRecord>> GetListAsync(int buildingId);
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
                PortfolioID,
                PremiseID,
                ContextJson,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate
            )
            OUTPUT INSERTED.AiAbstractionID
            VALUES (
                @BuildingId,
                @PortfolioId,
                @PremiseId,
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
                PortfolioId = command.PortfolioId,
                PremiseId   = command.PremiseId,
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

    public async Task<AiAbstractionRecord?> GetByIdAsync(int aiAbstractionId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.QueryFirstOrDefaultAsync<AiAbstractionRecord>(
            """
            SELECT
                AiAbstractionID  AS AbstractionId,
                BuildingID       AS BuildingId,
                PortfolioID      AS PortfolioId,
                PremiseID        AS PremiseId,
                [Status]         AS Status,
                CompletedDate    AS CompletedDate,
                ErrorMessage     AS ErrorMessage,
                ContextJson      AS ContextJson,
                AIOutputJson     AS AiOutputJson,
                AI_Tenant        AS AiTenant,
                AI_LeaseEndDate  AS AiLeaseEndDate,
                ReviewedFormData AS ReviewedFormData,
                CreatedBy        AS CreatedBy,
                CreatedDate      AS CreatedDate,
                LastModifiedBy   AS LastModifiedBy,
                LastModifiedDate AS LastModifiedDate
            FROM dbo.tblAiAbstractionLeases
            WHERE AiAbstractionID = @AiAbstractionId
            """,
            new { AiAbstractionId = aiAbstractionId });
    }

    public async Task<IEnumerable<AiAbstractionRecord>> GetListAsync(int buildingId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.QueryAsync<AiAbstractionRecord>(
            """
            SELECT
                AiAbstractionID  AS AbstractionId,
                BuildingID       AS BuildingId,
                PortfolioID      AS PortfolioId,
                PremiseID        AS PremiseId,
                [Status]         AS Status,
                CompletedDate    AS CompletedDate,
                AI_Tenant        AS AiTenant,
                AI_LeaseEndDate  AS AiLeaseEndDate,
                CreatedBy        AS CreatedBy,
                CreatedDate      AS CreatedDate,
                LastModifiedBy   AS LastModifiedBy,
                LastModifiedDate AS LastModifiedDate
            FROM dbo.tblAiAbstractionLeases
            WHERE BuildingID = @BuildingId
              AND [Status] <> 'Cancelled'
            ORDER BY CreatedDate DESC
            """,
            new { BuildingId = buildingId });
    }
}
