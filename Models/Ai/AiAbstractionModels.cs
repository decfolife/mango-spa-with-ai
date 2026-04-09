namespace MangoSPA.Models.Ai;

/// <summary>
/// Form data sent when creating a new AI lease abstraction.
/// All values match what the Add AI Lease modal collects via getRenderSelect dropdowns.
/// Files are submitted alongside this as multipart/form-data.
/// </summary>
public class CreateAiAbstractionRequest
{
    // ── Core identifiers ────────────────────────────────────────────────────
    public int BuildingId { get; set; }
    public int? PortfolioId { get; set; }
    public int? PremiseId { get; set; }
    public int? PremiseTypeId { get; set; }
    public string? NewPremiseName { get; set; }

    // ── Lease configuration (mirrors Add Lease modal dropdowns) ─────────────
    public int? LeaseTemplateId { get; set; }       // getRenderSelect 56
    public string? AccountingType { get; set; }     // getRenderSelect 127
    public int? MeasurementUnitId { get; set; }     // getRenderSelect 20
    public int? ParentLeaseId { get; set; }         // getRenderSelect 112

    // ── AI abstraction specific ──────────────────────────────────────────────
    public bool IncludesAmendments { get; set; }
    public string? AbstractionNotes { get; set; }
}

/// <summary>
/// Returned after a successful POST /ai-abstractions.
/// </summary>
public record CreateAiAbstractionResponse(int AbstractionId);

/// <summary>
/// Summary row used in the list view.
/// </summary>
public class AiAbstractionListItem
{
    public int AbstractionId { get; set; }
    public int BuildingId { get; set; }
    public string Status { get; set; } = "Pending";
    public string? AiTenant { get; set; }
    public string? AiLeaseEndDate { get; set; }
    public DateTime CreatedDate { get; set; }
}

/// <summary>
/// Full detail returned by GET /ai-abstractions/{id}.
/// AIOutputJson is the raw JSON string of IAIOutput; the caller parses it.
/// </summary>
public class AiAbstractionDetail
{
    public int AbstractionId { get; set; }
    public int BuildingId { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ErrorMessage { get; set; }
    public string InputJson { get; set; } = "{}";
    public string? AiOutputJson { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
}
