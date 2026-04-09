using FluentValidation;
using System.IO;

namespace FormsEngine.Application.Ai;

public class CreateAiAbstractionCommandValidator : AbstractValidator<CreateAiAbstractionCommand>
{
    private static readonly string[] AllowedExtensions = [".pdf", ".doc", ".docx", ".tif", ".tiff", ".jpg", ".jpeg", ".png"];

    public CreateAiAbstractionCommandValidator()
    {
        RuleFor(x => x.BuildingId)
            .GreaterThan(0).WithMessage("BuildingId must be a positive integer.");

        RuleFor(x => x.Files)
            .NotEmpty().WithMessage("At least one lease document is required.");

        RuleForEach(x => x.Files).ChildRules(file =>
        {
            file.RuleFor(f => f.Length)
                .GreaterThan(0).WithMessage("File must not be empty.");

            file.RuleFor(f => f.FileName)
                .NotEmpty().WithMessage("File name is required.")
                .Must(name => Array.Exists(AllowedExtensions, e => e == Path.GetExtension(name).ToLowerInvariant()))
                .WithMessage($"File must be a supported document type ({string.Join(", ", AllowedExtensions)}).");
        });
    }
}
