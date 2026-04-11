using FluentValidation;
using System.IO;

namespace FormsEngine.Application.Ai;

public class CreateAiAbstractionCommandValidator : AbstractValidator<CreateAiAbstractionCommand>
{
    private static readonly string[] AllowedExtensions = [".pdf", ".doc", ".docx", ".tif", ".tiff", ".jpg", ".jpeg", ".png"];
    private static readonly string[] AllowedAccountingTypes = ["AR", "AP", "IC"];

    private const int MaxFiles = 20;
    private const long MaxFileSizeBytes = 100 * 1024 * 1024; // 100 MB per file
    private const int MaxNotesLength = 4000;
    private const int MaxPremiseNameLength = 500;

    public CreateAiAbstractionCommandValidator()
    {
        // ── Required ─────────────────────────────────────────────────────────
        RuleFor(x => x.BuildingId)
            .GreaterThan(0).WithMessage("BuildingId must be a positive integer.");

        // ── Optional IDs — must be positive if provided ───────────────────────
        RuleFor(x => x.PortfolioId)
            .GreaterThan(0).WithMessage("PortfolioId must be a positive integer.")
            .When(x => x.PortfolioId.HasValue);

        RuleFor(x => x.PremiseId)
            .GreaterThan(0).WithMessage("PremiseId must be a positive integer.")
            .When(x => x.PremiseId.HasValue);

        RuleFor(x => x.PremiseTypeId)
            .GreaterThan(0).WithMessage("PremiseTypeId must be a positive integer.")
            .When(x => x.PremiseTypeId.HasValue);

        RuleFor(x => x.LeaseTemplateId)
            .GreaterThan(0).WithMessage("LeaseTemplateId must be a positive integer.")
            .When(x => x.LeaseTemplateId.HasValue);

        RuleFor(x => x.MeasurementUnitId)
            .GreaterThan(0).WithMessage("MeasurementUnitId must be a positive integer.")
            .When(x => x.MeasurementUnitId.HasValue);

        RuleFor(x => x.ParentLeaseId)
            .GreaterThan(0).WithMessage("ParentLeaseId must be a positive integer.")
            .When(x => x.ParentLeaseId.HasValue);

        // ── Accounting type — constrained to known values ─────────────────────
        RuleFor(x => x.AccountingType)
            .Must(t => AllowedAccountingTypes.Contains(t))
            .WithMessage($"AccountingType must be one of: {string.Join(", ", AllowedAccountingTypes)}.")
            .When(x => !string.IsNullOrEmpty(x.AccountingType));

        // ── String lengths ────────────────────────────────────────────────────
        RuleFor(x => x.AbstractionNotes)
            .MaximumLength(MaxNotesLength).WithMessage($"AbstractionNotes must not exceed {MaxNotesLength} characters.")
            .When(x => !string.IsNullOrEmpty(x.AbstractionNotes));

        RuleFor(x => x.NewPremiseName)
            .MaximumLength(MaxPremiseNameLength).WithMessage($"NewPremiseName must not exceed {MaxPremiseNameLength} characters.")
            .When(x => !string.IsNullOrEmpty(x.NewPremiseName));

        // ── Files ─────────────────────────────────────────────────────────────
        RuleFor(x => x.Files)
            .NotEmpty().WithMessage("At least one lease document is required.")
            .Must(f => f.Count <= MaxFiles).WithMessage($"No more than {MaxFiles} files may be uploaded at once.");

        RuleForEach(x => x.Files).ChildRules(file =>
        {
            file.RuleFor(f => f.Length)
                .GreaterThan(0).WithMessage("File must not be empty.")
                .LessThanOrEqualTo(MaxFileSizeBytes).WithMessage($"Each file must not exceed {MaxFileSizeBytes / 1024 / 1024} MB.");

            file.RuleFor(f => f.FileName)
                .NotEmpty().WithMessage("File name is required.")
                .Must(name => Array.Exists(AllowedExtensions, e => e == Path.GetExtension(name).ToLowerInvariant()))
                .WithMessage($"File must be a supported document type ({string.Join(", ", AllowedExtensions)}).");
        });
    }
}
