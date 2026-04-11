using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace FormsEngine.Application.Ai;

/// <summary>
/// Abstraction over the AI processing service.
/// Swap this out for a real LLM client (Azure OpenAI, Anthropic, etc.) when ready.
/// </summary>
public interface IAiProvider
{
    Task<string> ProcessAsync(string inputJson, CancellationToken cancellationToken);
}

/// <summary>
/// Mock implementation — returns realistic hardcoded AI output so the full
/// Pending → Complete flow works end-to-end without an actual AI service.
/// </summary>
public class AiMockProvider : IAiProvider
{
    public async Task<string> ProcessAsync(string inputJson, CancellationToken cancellationToken)
    {
        // Simulate network / model latency
        await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);

        // Parse whatever input we were given so we can echo a few fields back
        string tenant    = "Sample Tenant Corp";
        string landlord  = "Sample Landlord LLC";
        string street    = "123 Main Street";
        string cityState = "New York, NY 10001";
        string suite     = "500";

        try
        {
            using var doc = JsonDocument.Parse(inputJson);
            // Nothing in the input tells us the tenant yet (that's what the AI figures out),
            // but we can read the notes field for flavour text if present.
        }
        catch { /* ignore parse errors in the mock */ }

        var startDate    = DateTime.UtcNow.AddMonths(1).ToString("yyyy-MM-dd");
        var rcdDate      = DateTime.UtcNow.AddMonths(7).ToString("yyyy-MM-dd");
        var endDate      = DateTime.UtcNow.AddMonths(73).ToString("yyyy-MM-dd");
        var signDate     = DateTime.UtcNow.AddMonths(-3).ToString("yyyy-MM-dd");
        var abstractDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

        // Monthly base rent calculated as 15 000 SF × $45/SF / 12
        const int    sf             = 15_000;
        const double annualRentPerSf = 45.0;
        var          monthlyRent     = (int)(sf * annualRentPerSf / 12);            // 56 250
        var          monthlyRentY2   = (int)(monthlyRent * 1.03);                   // +3%
        var          monthlyRentY3   = (int)(monthlyRentY2 * 1.03);
        var          monthlyRentY4   = (int)(monthlyRentY3 * 1.03);

        var output = new
        {
            basics = new
            {
                tenant             = new { value = tenant },
                landlord           = new { value = landlord },
                addresses          = new { value = new[] { new { StreetAddress = street, CityStateZip = cityState } } },
                squareFootage      = new { value = sf },
                leaseType          = new { value = "Direct" },
                dealType           = new { value = "New" },
                spaceUse           = new { value = "Office" },
                suite              = new { value = suite },
                floors             = new { value = new[] { "5" } },
                entireBuilding     = new { value = false },
                includesAmendments = new { value = false },
                isMultipleBuildings = new { value = false },
                isDataCenterLease  = new { value = false },
                isCRE              = new { value = true },
                monetaryUnitId     = new { value = 1 },
                abstractionDate    = new { value = abstractDate },
            },
            dates = new
            {
                leaseSignDate            = new { value = signDate },
                leaseStartDate           = new { value = startDate },
                leaseCommencementDate    = new { value = startDate },
                leaseEndDate             = new { value = endDate },
                rentCommencementDate     = new { value = rcdDate },
                leaseTermInMonths        = new { value = 72, subfields = new { beginsOnCD = true, beginsOnRCD = false } },
            },
            rent = new
            {
                effectiveRent = new { value = annualRentPerSf },
                annualEscalation = new { value = new { percent = 3.0, amount = (double?)null, onlyDuringExtension = false } },
                tenantImprovementAllowance = new
                {
                    value = sf * 50,
                    subfields = new
                    {
                        allowances = new[]
                        {
                            new
                            {
                                amount = 50, unit = "per sqft", improvementSqFt = sf,
                                totalAmount = sf * 50, improvementType = "Tenant Improvement",
                                landlordContribution = sf * 50, tenantContribution = 0, tenantReimburses = false,
                            },
                        },
                    },
                    citation = "Landlord shall provide a tenant improvement allowance of $50.00 per rentable square foot of the Premises.",
                },
                baseRentSchedule = new
                {
                    value = new[]
                    {
                        new { startMonth = 1,  endMonth = 12, startDate = rcdDate,                                           endDate = DateTime.UtcNow.AddMonths(19).ToString("yyyy-MM-dd"), monthlyBaseRent = monthlyRent  },
                        new { startMonth = 13, endMonth = 24, startDate = DateTime.UtcNow.AddMonths(19).ToString("yyyy-MM-dd"), endDate = DateTime.UtcNow.AddMonths(31).ToString("yyyy-MM-dd"), monthlyBaseRent = monthlyRentY2 },
                        new { startMonth = 25, endMonth = 36, startDate = DateTime.UtcNow.AddMonths(31).ToString("yyyy-MM-dd"), endDate = DateTime.UtcNow.AddMonths(43).ToString("yyyy-MM-dd"), monthlyBaseRent = monthlyRentY3 },
                        new { startMonth = 37, endMonth = 72, startDate = DateTime.UtcNow.AddMonths(43).ToString("yyyy-MM-dd"), endDate = endDate,                                               monthlyBaseRent = monthlyRentY4 },
                    },
                    subfields = new { startsFromCD = false, startsFromRCD = true, includesAdditionalRent = false, includesOperatingExpenses = false },
                },
                rentAbatements = new
                {
                    value = new[]
                    {
                        new
                        {
                            startMonth = 1, endMonth = 6,
                            startDate = rcdDate, endDate = DateTime.UtcNow.AddMonths(13).ToString("yyyy-MM-dd"),
                            discountAmount = monthlyRent, discountPercent = 100, betweenCDandRCD = false,
                        },
                    },
                },
            },
            expenses = new
            {
                serviceTypeId      = new { value = 3 },
                serviceTypeEstimate = new { value = "NNN" },
                operatingExpenses  = new { value = "tenant",   subfields = new { baseTenantResponsible  = true  }, citation = "Tenant is responsible for all operating expenses on a triple-net basis." },
                cam                = new { value = "tenant",   subfields = new { baseTenantResponsible  = true  } },
                insurance          = new { value = "tenant",   subfields = new { baseTenantResponsible  = true  } },
                taxes              = new { value = "tenant",   subfields = new { baseTenantResponsible  = true  } },
                water              = new { value = "landlord", subfields = new { baseLandlordResponsible = true } },
                gas                = new { value = "tenant",   subfields = new { baseTenantResponsible  = true  } },
                electricity        = new { value = "tenant",   subfields = new { baseTenantResponsible  = true  } },
                hvac               = new { value = "tenant",   subfields = new { baseTenantResponsible  = true  }, citation = "Tenant shall be responsible for all HVAC maintenance and costs." },
                cleaning           = new { value = "tenant",   subfields = new { tenantResponsibleForPremises = true } },
            },
        };

        return JsonSerializer.Serialize(output, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
    }
}
