-- ============================================================
-- AI Abstraction Tables
-- Created:   2026-04-11
-- Author:    Mango CREM
-- Purpose:   Track AI lease abstraction requests end-to-end.
--
--            tblAiAbstractionLeases  – one row per abstraction request.
--              PortfolioID      – portfolio selected in the Add AI Lease modal
--              PremiseID        – premise selected in the Add AI Lease modal
--              ContextJson      – full modal inputs as JSON (portfolio, premise,
--                                 template, accounting type, etc.)
--              AIOutputJson     – structured JSON returned by the AI service
--              ReviewedFormData – user-verified field answers saved from the
--                                 review form before the lease is created
--
--            tblAiAbstractionDocuments – uploaded source documents (PDFs,
--              images, etc.) linked to a lease abstraction request.
-- ============================================================

-- ── tblAiAbstractionLeases ───────────────────────────────────────────────────

CREATE TABLE dbo.tblAiAbstractionLeases (

    -- Primary key
    AiAbstractionID      INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,

    -- Context: building, portfolio, and premise selected in the modal
    BuildingID           INT            NOT NULL,
    PortfolioID          INT            NULL,
    PremiseID            INT            NULL,

    -- Workflow
    [Status]             NVARCHAR(50)   NOT NULL DEFAULT 'Pending',
    CompletedDate        DATETIME2      NULL,
    ErrorMessage         NVARCHAR(MAX)  NULL,

    -- Full modal inputs as JSON (template, accounting type, notes, etc.)
    ContextJson          NVARCHAR(MAX)  NULL,

    -- AI processing output (raw structured JSON from the AI service)
    AIOutputJson         NVARCHAR(MAX)  NULL,

    -- Promoted top-level AI fields for list-query performance
    AI_Tenant            NVARCHAR(500)  NULL,
    AI_LeaseEndDate      DATE           NULL,
    AI_ServiceTypeID     AS TRY_CAST(
                             JSON_VALUE(AIOutputJson, '$.expenses.serviceTypeId.value')
                             AS INT
                         ) PERSISTED,

    -- User-reviewed form answers (saved when the user approves the abstraction)
    ReviewedFormData     NVARCHAR(MAX)  NULL,

    -- Audit
    CreatedBy            INT            NOT NULL DEFAULT 0,
    CreatedDate          DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    LastModifiedBy       INT            NOT NULL DEFAULT 0,
    LastModifiedDate     DATETIME2      NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_tblAiAbstractionLeases_BuildingID
        FOREIGN KEY (BuildingID) REFERENCES dbo.tblBuildings(BuildingID)
);
GO

-- List abstractions by building, newest first
CREATE NONCLUSTERED INDEX IX_tblAiAbstractionLeases_Building
    ON dbo.tblAiAbstractionLeases (BuildingID, CreatedDate DESC)
    INCLUDE (AiAbstractionID, [Status], CompletedDate, PortfolioID, PremiseID, AI_Tenant, AI_LeaseEndDate);
GO

-- Filter by AI-extracted service type
-- Note: SQL Server does not support filtered indexes on computed columns;
--       a plain nonclustered index is used instead.
CREATE NONCLUSTERED INDEX IX_tblAiAbstractionLeases_ServiceTypeID
    ON dbo.tblAiAbstractionLeases (AI_ServiceTypeID);
GO

-- ── tblAiAbstractionDocuments ────────────────────────────────────────────────

CREATE TABLE dbo.tblAiAbstractionDocuments (

    -- Primary key
    DocumentID           INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,

    -- Parent abstraction
    AiAbstractionID      INT            NOT NULL,

    -- File details
    OriginalFileName     NVARCHAR(500)  NOT NULL,
    StoredFileName       NVARCHAR(500)  NOT NULL,
    ShareFolderPath      NVARCHAR(1000) NOT NULL,
    FileSizeBytes        BIGINT         NULL,
    MimeType             NVARCHAR(200)  NULL,
    SortOrder            INT            NOT NULL DEFAULT 0,

    -- Audit
    CreatedBy            INT            NOT NULL DEFAULT 0,
    CreatedDate          DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    LastModifiedBy       INT            NOT NULL DEFAULT 0,
    LastModifiedDate     DATETIME2      NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_tblAiAbstractionDocuments_AiAbstractionID
        FOREIGN KEY (AiAbstractionID) REFERENCES dbo.tblAiAbstractionLeases(AiAbstractionID)
);
GO

CREATE NONCLUSTERED INDEX IX_tblAiAbstractionDocuments_AiAbstractionID
    ON dbo.tblAiAbstractionDocuments (AiAbstractionID);
GO
