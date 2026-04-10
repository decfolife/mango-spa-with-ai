-- Migration 003: Add audit columns to AI abstractions tables
-- Renames CreatedByUserID -> CreatedBy for naming consistency and
-- adds LastModifiedBy + LastModifiedDate to both tables.

-- ── AILeaseAbstractions ───────────────────────────────────────────────────────

EXEC sp_rename 'dbo.tblAILeaseAbstractions.CreatedByUserID', 'CreatedBy', 'COLUMN';
GO

ALTER TABLE dbo.tblAILeaseAbstractions
    ADD LastModifiedBy   INT       NOT NULL DEFAULT 0,
        LastModifiedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
GO

UPDATE dbo.tblAILeaseAbstractions
SET    LastModifiedBy   = CreatedBy,
       LastModifiedDate = CreatedDate;
GO

-- ── tblAIAbstractionDocuments ─────────────────────────────────────────────────

EXEC sp_rename 'dbo.tblAIAbstractionDocuments.UploadedByUserID', 'CreatedBy', 'COLUMN';
GO

ALTER TABLE dbo.tblAIAbstractionDocuments
    ADD CreatedDate      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        LastModifiedBy   INT       NOT NULL DEFAULT 0,
        LastModifiedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
GO

UPDATE dbo.tblAIAbstractionDocuments
SET    LastModifiedBy   = CreatedBy,
       LastModifiedDate = CreatedDate;
GO
