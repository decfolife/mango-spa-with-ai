using System;
using System.Threading;
using System.Threading.Tasks;
using Common.Contracts.HTTP.Microservice;
using Common.Enums;
using Dapper;
using FormsEngine.Application.Common.Interfaces;
using Infrastructure.Services;
using MediatR;
using Microsoft.Data.SqlClient;

namespace FormsEngine.Application.Queries;

public class GetAiAbstractionQuery : IRequest<ApiResponse>
{
    public int AbstractionId { get; set; }
}

public class GetAiAbstractionQueryHandler : IRequestHandler<GetAiAbstractionQuery, ApiResponse>
{
    readonly IClientsDbConnectionProvider _dbProvider;
    readonly ILogDirectService _logger;
    readonly ICurrentUserService _currentUserService;

    public GetAiAbstractionQueryHandler(
        IClientsDbConnectionProvider dbProvider,
        ILogDirectService logger,
        ICurrentUserService currentUserService)
    {
        _dbProvider = dbProvider;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse> Handle(GetAiAbstractionQuery request, CancellationToken cancellationToken)
    {
        using SqlConnection connection = new(await _dbProvider.GetConnectionString());
        try
        {
            var data = await connection.QueryFirstOrDefaultAsync(
                """
                SELECT
                    AbstractionID,
                    BuildingID,
                    [Status],
                    ErrorMessage,
                    InputJson,
                    AIOutputJson AS AiOutputJson,
                    CreatedDate,
                    CompletedDate
                FROM dbo.AILeaseAbstractions
                WHERE AbstractionID = @AbstractionId
                """,
                new { AbstractionId = request.AbstractionId });

            if (data == null)
                return new ApiResponse(false, "Abstraction not found.");

            return new ApiResponse(true, data);
        }
        catch (Exception ex)
        {
            string errorMessage = $"AiAbstractions: Exception Occurred, Method -- GetAiAbstractionById, Error Message: {ex.Message}, Inner Exception: {ex.InnerException}, Stack Trace: {ex.StackTrace}";
            await _logger.LogToProcessLogEntries((int)ProcessLogType.Mango, _currentUserService.ClientKey, Environment.MachineName, "F", errorMessage, _currentUserService.UserId);
            return new ApiResponse(false, ex.Message);
        }
    }
}
