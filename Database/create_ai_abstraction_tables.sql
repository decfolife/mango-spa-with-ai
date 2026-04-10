CREATE TABLE dbo.tblAiAbstractionLeases (
    AbstractionID         INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    BuildingID            INT            NOT NULL,
    [Status]              NVARCHAR(50)   NOT NULL DEFAULT 'Pending',
    ErrorMessage          NVARCHAR(MAX)  NULL,
    InputJson             NVARCHAR(MAX)  NULL,
    AIOutputJson          NVARCHAR(MAX)  NULL,

    -- AI output fields (top-level)
    AI_Tenant             NVARCHAR(500)  NULL,
    AI_LeaseEndDate       DATE           NULL,
    AI_ServiceTypeID      AS TRY_CAST(
                              JSON_VALUE(AIOutputJson, '$.expenses.serviceTypeId.value')
                              AS INT
                          ) PERSISTED,

    -- Input parameters
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

CREATE INDEX IX_tblAiAbstractionLeases_BuildingID
    ON dbo.tblAiAbstractionLeases (BuildingID);
GO

CREATE NONCLUSTERED INDEX IX_tblAiAbstractionLeases_ServiceTypeID
    ON dbo.tblAiAbstractionLeases (AI_ServiceTypeID)
    WHERE AI_ServiceTypeID IS NOT NULL;
GO

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

CREATE INDEX IX_tblAiAbstractionDocuments_AbstractionID
    ON dbo.tblAiAbstractionDocuments (AbstractionID);
GO
