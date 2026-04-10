using System.Threading.Tasks;
using Dapper;
using FormsEngine.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;

namespace FormsEngine.Application.Ai;

public interface IAiAbstractionRepository
{
    Task<int> CreateAsync(CreateAiAbstractionCommand command, int userId, string inputJson);
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

    public async Task<int> CreateAsync(CreateAiAbstractionCommand command, int userId, string inputJson)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        return await connection.ExecuteScalarAsync<int>(
            """
            INSERT INTO dbo.tblAbstractionLeases (
                BuildingID,
                InputJson,
                In_PortfolioID,
                In_PremiseID,
                In_PremiseTypeID,
                In_NewPremiseName,
                In_LeaseTemplateID,
                In_AccountingType,
                In_MeasureUnitsID,
                In_ParentLeaseID,
                In_IncludesAmendments,
                In_AbstractionNotes,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate
            )
            OUTPUT INSERTED.AbstractionID
            VALUES (
                @BuildingId,
                @InputJson,
                @PortfolioId,
                @PremiseId,
                @PremiseTypeId,
                @NewPremiseName,
                @LeaseTemplateId,
                @AccountingType,
                @MeasurementUnitId,
                @ParentLeaseId,
                @IncludesAmendments,
                @AbstractionNotes,
                @UserId,
                GETUTCDATE(),
                @UserId,
                GETUTCDATE()
            )
            """,
            new
            {
                BuildingId          = command.BuildingId,
                InputJson           = inputJson,
                PortfolioId         = command.PortfolioId,
                PremiseId           = command.PremiseId,
                PremiseTypeId       = command.PremiseTypeId,
                NewPremiseName      = command.NewPremiseName,
                LeaseTemplateId     = command.LeaseTemplateId,
                AccountingType      = command.AccountingType,
                MeasurementUnitId   = command.MeasurementUnitId,
                ParentLeaseId       = command.ParentLeaseId,
                IncludesAmendments  = command.IncludesAmendments,
                AbstractionNotes    = command.AbstractionNotes,
                UserId              = userId,
            });
    }

    public async Task AddDocumentAsync(int abstractionId, string originalFileName, string storedFileName,
        string shareFolderPath, long? fileSizeBytes, string? mimeType, int sortOrder, int userId)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.tblAbstractionDocuments
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
                AbstractionId   = abstractionId,
                OriginalFileName = originalFileName,
                StoredFileName  = storedFileName,
                ShareFolderPath = shareFolderPath,
                FileSizeBytes   = fileSizeBytes,
                MimeType        = mimeType,
                SortOrder       = sortOrder,
                UserId          = userId,
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
                AIOutputJson        AS AiOutputJson,
                In_PortfolioID      AS PortfolioId,
                In_PremiseID        AS PremiseId,
                In_PremiseTypeID    AS PremiseTypeId,
                In_NewPremiseName   AS NewPremiseName,
                In_LeaseTemplateID  AS LeaseTemplateId,
                In_AccountingType   AS AccountingType,
                In_MeasureUnitsID   AS MeasurementUnitId,
                In_ParentLeaseID    AS ParentLeaseId,
                In_IncludesAmendments AS IncludesAmendments,
                In_AbstractionNotes AS AbstractionNotes,
                CreatedBy,
                CreatedDate,
                LastModifiedBy,
                LastModifiedDate,
                CompletedDate
            FROM dbo.tblAbstractionLeases
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
            FROM dbo.tblAbstractionLeases
            WHERE BuildingID = @BuildingId
              AND [Status] <> 'Cancelled'
            ORDER BY CreatedDate DESC
            """,
            new { BuildingId = buildingId });
    }
}
