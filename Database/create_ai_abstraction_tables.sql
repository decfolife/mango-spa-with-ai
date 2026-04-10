-- ============================================================
-- AI Abstraction Tables
-- ============================================================

-- ── tblAiAbstractionLeases ───────────────────────────────────

CREATE TABLE dbo.tblAiAbstractionLeases (
    AbstractionID         INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    BuildingID            INT            NOT NULL,
    [Status]              NVARCHAR(50)   NOT NULL DEFAULT 'Pending',
    ErrorMessage          NVARCHAR(MAX)  NULL,

    -- Raw input/output JSON payloads
    InputJson             NVARCHAR(MAX)  NULL,
    AIOutputJson          NVARCHAR(MAX)  NULL,

    -- AI output fields promoted for querying
    AI_Tenant             NVARCHAR(500)  NULL,
    AI_LeaseEndDate       DATE           NULL,
    AI_ServiceTypeID      AS TRY_CAST(
                              JSON_VALUE(AIOutputJson, '$.expenses.serviceTypeId.value')
                              AS INT
                          ) PERSISTED,

    -- Input parameters captured from the abstraction request
    In_PortfolioID        INT            NULL,
    In_PremiseID          INT            NULL,
    In_PremiseTypeID      INT            NULL,
    In_NewPremiseName     NVARCHAR(500)  NULL,
    In_LeaseTemplateID    INT            NULL,
    In_AccountingType     NVARCHAR(10)   NULL,
    In_MeasureUnitsID     INT            NULL,
    In_ParentLeaseID      INT            NULL,
    In_IncludesAmendments BIT            NOT NULL DEFAULT 0,
    In_AbstractionNotes   NVARCHAR(4000) NULL,

    -- Audit columns
    CreatedBy             INT            NOT NULL DEFAULT 0,
    CreatedDate           DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    LastModifiedBy        INT            NOT NULL DEFAULT 0,
    LastModifiedDate      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CompletedDate         DATETIME2      NULL,

    CONSTRAINT FK_tblAiAbstractionLeases_BuildingID
        FOREIGN KEY (BuildingID) REFERENCES dbo.tblBuildings(BuildingID)
);
GO

-- Query abstractions by building, ordered by newest first
CREATE NONCLUSTERED INDEX IX_tblAiAbstractionLeases_Building
    ON dbo.tblAiAbstractionLeases (BuildingID, CreatedDate DESC)
    INCLUDE (AbstractionID, [Status], AI_Tenant, AI_LeaseEndDate, In_AccountingType);
GO

-- Query/filter abstractions by AI-extracted service type
-- Note: filtered indexes are not supported on computed columns in SQL Server;
--       a plain index on the persisted column is used instead.
CREATE NONCLUSTERED INDEX IX_tblAiAbstractionLeases_ServiceTypeID
    ON dbo.tblAiAbstractionLeases (AI_ServiceTypeID);
GO

-- ── tblAiAbstractionDocuments ────────────────────────────────

CREATE TABLE dbo.tblAiAbstractionDocuments (
    DocumentID            INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
    AbstractionID         INT             NOT NULL,
    OriginalFileName      NVARCHAR(500)   NOT NULL,
    StoredFileName        NVARCHAR(500)   NOT NULL,
    ShareFolderPath       NVARCHAR(1000)  NOT NULL,
    FileSizeBytes         BIGINT          NULL,
    MimeType              NVARCHAR(200)   NULL,
    SortOrder             INT             NOT NULL DEFAULT 0,

    -- Audit columns
    CreatedBy             INT             NOT NULL DEFAULT 0,
    CreatedDate           DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    LastModifiedBy        INT             NOT NULL DEFAULT 0,
    LastModifiedDate      DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_tblAiAbstractionDocuments_AbstractionID
        FOREIGN KEY (AbstractionID) REFERENCES dbo.tblAiAbstractionLeases(AbstractionID)
);
GO

CREATE NONCLUSTERED INDEX IX_tblAiAbstractionDocuments_AbstractionID
    ON dbo.tblAiAbstractionDocuments (AbstractionID);
GO
