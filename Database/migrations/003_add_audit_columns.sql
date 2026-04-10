-- Migration 003: Add audit columns to AI abstractions tables
-- Renames CreatedByUserID -> CreatedBy for naming consistency and
-- adds LastModifiedBy + LastModifiedDate to both tables.

-- ── AILeaseAbstractions ───────────────────────────────────────────────────────

EXEC sp_rename 'dbo.AILeaseAbstractions.CreatedByUserID', 'CreatedBy', 'COLUMN';
GO

ALTER TABLE dbo.AILeaseAbstractions
    ADD LastModifiedBy   INT       NOT NULL DEFAULT 0,
        LastModifiedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
GO

-- Backfill LastModifiedBy / LastModifiedDate from existing created values
UPDATE dbo.AILeaseAbstractions
SET    LastModifiedBy   = CreatedBy,
       LastModifiedDate = CreatedDate;
GO

-- ── AIAbstractionDocuments ────────────────────────────────────────────────────

EXEC sp_rename 'dbo.AIAbstractionDocuments.UploadedByUserID', 'CreatedBy', 'COLUMN';
GO

ALTER TABLE dbo.AIAbstractionDocuments
    ADD CreatedDate      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        LastModifiedBy   INT       NOT NULL DEFAULT 0,
        LastModifiedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE();
GO

UPDATE dbo.AIAbstractionDocuments
SET    LastModifiedBy   = CreatedBy,
       LastModifiedDate = CreatedDate;
GO
