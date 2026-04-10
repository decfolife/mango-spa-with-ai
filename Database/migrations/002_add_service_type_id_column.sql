-- Migration 002: Add AI_ServiceTypeID persisted computed column
-- The serviceTypeId is already emitted by the AI in AIOutputJson as:
--   expenses.serviceTypeId.value  (integer: 1=Full Service Gross, 2=Modified Gross, 3=NNN, ...)
--
-- This makes the service type queryable/indexable without parsing JSON at query time.

ALTER TABLE dbo.tblAiAbstractionLeases
ADD AI_ServiceTypeID AS TRY_CAST(
    JSON_VALUE(AIOutputJson, '$.expenses.serviceTypeId.value')
    AS INT
) PERSISTED;
GO

-- Optional index for filtering abstractions by service type
CREATE NONCLUSTERED INDEX IX_AILeaseAbstractions_ServiceTypeID
ON dbo.tblAiAbstractionLeases (AI_ServiceTypeID)
WHERE AI_ServiceTypeID IS NOT NULL;
GO
