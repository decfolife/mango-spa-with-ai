-- Migration 003: Stored procedures for AI Lease Abstractions
-- These replace the inline SQL used in the BFF prototype.
-- All procedures follow the spVerb[Noun] naming convention used in formsengine.

-- ─────────────────────────────────────────────────────────────────────────────
-- spCreateAiAbstraction
-- Inserts a new abstraction record and returns the new AbstractionID.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.spCreateAiAbstraction
    @BuildingId       INT,
    @CreatedByUserId  INT,
    @InputJson        NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.AILeaseAbstractions (BuildingID, CreatedByUserID, InputJson)
    OUTPUT INSERTED.AbstractionID
    VALUES (@BuildingId, @CreatedByUserId, @InputJson);
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- spAddAiAbstractionDocument
-- Records a single uploaded document linked to an abstraction.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.spAddAiAbstractionDocument
    @AbstractionId      INT,
    @OriginalFileName   NVARCHAR(500),
    @StoredFileName     NVARCHAR(500),
    @ShareFolderPath    NVARCHAR(1000),
    @FileSizeBytes      BIGINT         = NULL,
    @MimeType           NVARCHAR(200)  = NULL,
    @SortOrder          INT            = 0,
    @UploadedByUserId   INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.AIAbstractionDocuments
        (AbstractionID, OriginalFileName, StoredFileName, ShareFolderPath,
         FileSizeBytes, MimeType, SortOrder, UploadedByUserID)
    VALUES
        (@AbstractionId, @OriginalFileName, @StoredFileName, @ShareFolderPath,
         @FileSizeBytes, @MimeType, @SortOrder, @UploadedByUserId);
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- spGetAiAbstractionById
-- Returns full detail for a single abstraction including AI output JSON.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.spGetAiAbstractionById
    @AbstractionId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        AbstractionID,
        BuildingID,
        [Status],
        ErrorMessage,
        InputJson,
        AIOutputJson    AS AiOutputJson,
        CreatedDate,
        CompletedDate
    FROM dbo.AILeaseAbstractions
    WHERE AbstractionID = @AbstractionId;
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- spGetAiAbstractionsByBuilding
-- Returns summary list for a building, excluding cancelled records.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR ALTER PROCEDURE dbo.spGetAiAbstractionsByBuilding
    @BuildingId INT,
    @UserID     INT
AS
BEGIN
    SET NOCOUNT ON;

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
    ORDER BY CreatedDate DESC;
END
GO
