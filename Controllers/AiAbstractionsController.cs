using MangoSPA.Extensions;
using MangoSPA.Models.Ai;
using MangoSPA.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MangoSPA.Controllers;

[Authorize]
[Route("[controller]")]
public class AiAbstractionsController : ControllerBase
{
    private readonly IAiAbstractionRepository _repository;
    private readonly IAiDocumentStorageService _storage;
    private readonly ILogger<AiAbstractionsController> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public AiAbstractionsController(
        IAiAbstractionRepository repository,
        IAiDocumentStorageService storage,
        ILogger<AiAbstractionsController> logger)
    {
        _repository = repository;
        _storage = storage;
        _logger = logger;
    }

    /// <summary>
    /// List AI abstractions for a building.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<AiAbstractionListItem>>> GetList(
        [FromQuery] int buildingId, CancellationToken ct)
    {
        if (buildingId <= 0)
            return BadRequest("buildingId is required.");

        var items = await _repository.GetListAsync(buildingId, ct);
        return Ok(items);
    }

    /// <summary>
    /// Get a single AI abstraction by ID.
    /// Returns status + the raw IAIOutput JSON when complete.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AiAbstractionDetail>> GetById(int id, CancellationToken ct)
    {
        var item = await _repository.GetByIdAsync(id, ct);
        if (item is null)
            return NotFound();

        return Ok(item);
    }

    /// <summary>
    /// Create a new AI abstraction request.
    /// Accepts multipart/form-data: JSON form fields + one or more lease documents.
    /// Returns the new AbstractionID and 201 Created.
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(524_288_000)] // 500 MB max total upload
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CreateAiAbstractionResponse>> Create(
        [FromForm] CreateAiAbstractionRequest request,
        [FromForm] List<IFormFile> files,
        CancellationToken ct)
    {
        if (request.BuildingId <= 0)
            return BadRequest("BuildingId is required.");

        if (files == null || files.Count == 0)
            return BadRequest("At least one lease document is required.");

        var userId = User.ContactId();
        if (userId == 0)
            return Unauthorized();

        // Serialize the form input as the InputJson stored in the DB
        var inputJson = JsonSerializer.Serialize(request, _jsonOptions);

        int abstractionId;
        try
        {
            abstractionId = await _repository.CreateAsync(inputJson, request.BuildingId, userId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create AI abstraction for building {BuildingId}", request.BuildingId);
            return StatusCode(StatusCodes.Status500InternalServerError, "Failed to create abstraction record.");
        }

        // Save documents to the share and record each in the DB
        for (int i = 0; i < files.Count; i++)
        {
            var file = files[i];
            try
            {
                var (storedFileName, shareFolderPath) = await _storage.SaveAsync(abstractionId, file, i, ct);

                await _repository.AddDocumentAsync(
                    abstractionId,
                    originalFileName: file.FileName,
                    storedFileName: storedFileName,
                    shareFolderPath: shareFolderPath,
                    fileSizeBytes: file.Length,
                    mimeType: file.ContentType,
                    sortOrder: i,
                    uploadedByUserId: userId,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save document {FileName} for abstraction {AbstractionId}",
                    file.FileName, abstractionId);
                // Continue processing remaining files — partial upload is acceptable
            }
        }

        _logger.LogInformation("Created AI abstraction {AbstractionId} for building {BuildingId} by user {UserId}",
            abstractionId, request.BuildingId, userId);

        var response = new CreateAiAbstractionResponse(abstractionId);
        return CreatedAtAction(nameof(GetById), new { id = abstractionId }, response);
    }
}
