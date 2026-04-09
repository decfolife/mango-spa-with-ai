namespace MangoSPA.Models.Ai;

/// <summary>
/// Form data sent when creating a new AI lease abstraction.
/// Files are submitted alongside this as multipart/form-data.
/// </summary>
public class CreateAiAbstractionRequest
{
    public int BuildingId { get; set; }
    public int? PortfolioId { get; set; }
    public string? AccountingType { get; set; }
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
