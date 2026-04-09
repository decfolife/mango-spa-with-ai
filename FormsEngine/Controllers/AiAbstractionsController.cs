using Common.Contracts.HTTP.Microservice;
using FormsEngine.Application.Commands;
using FormsEngine.Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FormsEngine.API.Controllers;

[Authorize]
public class AiAbstractionsController : ApiControllerBase
{
    public AiAbstractionsController(IMediator mediator) : base(mediator)
    {
    }

    [HttpPost("CreateAiAbstraction")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(524_288_000)]
    public async Task<ActionResult<ApiResponse>> CreateAiAbstraction([FromForm] CreateAiAbstractionCommand command)
    {
        var response = await Mediator.Send(command);
        return response.Success ? Ok(response) : BadRequest();
    }

    [HttpGet("GetAiAbstractionById")]
    public async Task<ActionResult<ApiResponse>> GetAiAbstractionById(int abstractionId)
    {
        var response = await Mediator.Send(new GetAiAbstractionQuery { AbstractionId = abstractionId });
        return response.Success ? Ok(response) : BadRequest();
    }

    [HttpGet("GetAiAbstractionsByBuilding")]
    public async Task<ActionResult<ApiResponse>> GetAiAbstractionsByBuilding(int buildingId)
    {
        var response = await Mediator.Send(new GetAiAbstractionsListQuery { BuildingId = buildingId });
        return response.Success ? Ok(response) : BadRequest();
    }
}
