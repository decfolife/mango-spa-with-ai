-- Migration 003: Add audit columns to AI abstractions tables
-- Renames CreatedByUserID -> CreatedBy for naming consistency and
-- adds LastModifiedBy + LastModifiedDate to both tables.

-- ── AILeaseAbstractions ───────────────────────────────────────────────────────

EXEC sp_rename 'dbo.tblAbstractionLeases.CreatedByUserID', 'CreatedBy', 'COLUMN';
GO

ALTER TABLE dbo.tblAbstractionLeases
    ADD LastModifiedBy   INT       NOT NULL DEFAULT 0,
        LastModifiedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
GO

UPDATE dbo.tblAbstractionLeases
SET    LastModifiedBy   = CreatedBy,
       LastModifiedDate = CreatedDate;
GO

-- ── tblAbstractionDocuments ─────────────────────────────────────────────────

EXEC sp_rename 'dbo.tblAbstractionDocuments.UploadedByUserID', 'CreatedBy', 'COLUMN';
GO

ALTER TABLE dbo.tblAbstractionDocuments
    ADD CreatedDate      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        LastModifiedBy   INT       NOT NULL DEFAULT 0,
        LastModifiedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
GO

UPDATE dbo.tblAbstractionDocuments
SET    LastModifiedBy   = CreatedBy,
       LastModifiedDate = CreatedDate;
GO
