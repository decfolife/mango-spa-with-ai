using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Common.Contracts.HTTP.Microservice;
using Common.Enums;
using Infrastructure.Services;
using MediatR;

namespace FormsEngine.Application.Ai;

public class GetAiMappedFieldsQuery : IRequest<ApiResponse>
{
    public int AbstractionId { get; set; }
    public int FormId       { get; set; }
    public int ObjectTypeId { get; set; } = 4;
    public string BearerToken { get; set; } = string.Empty;
}

public class GetAiMappedFieldsQueryHandler : IRequestHandler<GetAiMappedFieldsQuery, ApiResponse>
{
    readonly IAiAbstractionRepository _repository;
    readonly IAiAbstractionService    _service;
    readonly IFormFieldsClient        _formFieldsClient;
    readonly ILogDirectService        _logger;
    readonly ICurrentUserService      _currentUserService;

    public GetAiMappedFieldsQueryHandler(
        IAiAbstractionRepository repository,
        IAiAbstractionService    service,
        IFormFieldsClient        formFieldsClient,
        ILogDirectService        logger,
        ICurrentUserService      currentUserService)
    {
        _repository       = repository;
        _service          = service;
        _formFieldsClient = formFieldsClient;
        _logger           = logger;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse> Handle(GetAiMappedFieldsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // ── 1. Load AI output ────────────────────────────────────────────
            AiAbstractionRecord? abstraction = await _repository.GetByIdAsync(request.AbstractionId);
            if (abstraction is null)
                return new ApiResponse(false, "Abstraction not found.");

            string? aiOutputJson = abstraction.AiOutputJson;
            if (string.IsNullOrWhiteSpace(aiOutputJson))
                return new ApiResponse(false, "AI output is not available yet.");

            using var aiDoc = JsonDocument.Parse(aiOutputJson);
            var aiOutput = aiDoc.RootElement;

            // ── 2. Fetch form fields + sections from Forms microservice ───────
            var (fields, sections) = await _formFieldsClient.GetFieldsAsync(
                request.FormId, request.ObjectTypeId, request.BearerToken, cancellationToken);

            // ── 3. Map AI values onto fields ─────────────────────────────────
            var valueMap = AiOutputMapper.Map(aiOutput, fields);

            // Patch formItemAnswer into each field element
            var patchedFields = fields
                .Select(field =>
                {
                    var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(field.GetRawText())!;

                    if (field.TryGetProperty("formItemID", out var idEl) &&
                        valueMap.TryGetValue(idEl.GetInt32(), out var value))
                    {
                        dict["formItemAnswer"] = JsonSerializer.SerializeToElement(value);
                    }

                    return dict;
                })
                .ToList();

            // ── 4. Persist mapped values as ReviewedFormData (best-effort) ───
            try
            {
                var reviewedJson = JsonSerializer.Serialize(valueMap);
                await _service.SaveReviewedFormDataAsync(
                    request.AbstractionId, reviewedJson, _currentUserService.UserId);
            }
            catch { /* non-critical — form can still be rendered */ }

            return new ApiResponse(true, new { fields = patchedFields, sections });
        }
        catch (Exception ex)
        {
            var msg = $"AiAbstractions: GetAiMappedFields error — {ex.Message} | {ex.InnerException?.Message} | {ex.StackTrace}";
            await _logger.LogToProcessLogEntries(
                (int)ProcessLogType.Mango, _currentUserService.ClientKey,
                Environment.MachineName, "F", msg, _currentUserService.UserId);
            return new ApiResponse(false, ex.Message);
        }
    }
}
