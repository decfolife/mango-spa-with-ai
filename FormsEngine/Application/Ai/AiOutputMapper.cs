using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace FormsEngine.Application.Ai;

/// <summary>
/// Maps an IAIOutput JSON element to form field values using normalised name matching.
/// Mirrors the TypeScript AiFieldMapperService / MAPPING_RULES.
/// </summary>
public static class AiOutputMapper
{
    private record MappingRule(string[] Keys, string Path);

    private static readonly MappingRule[] Rules =
    [
        // ── Basics ───────────────────────────────────────────────────────────
        new(["tenantname", "tenant"],                                              "basics.tenant.value"),
        new(["landlordname", "landlord"],                                          "basics.landlord.value"),
        new(["squarefootage", "rentablearea", "grossarea", "leasedarea", "sqft",
             "netrentablearea"],                                                    "basics.squareFootage.value"),
        new(["suite", "suiteno", "suitenum"],                                      "basics.suite.value"),
        new(["floor", "floors"],                                                   "basics.floors.value"),
        new(["leasetype"],                                                         "basics.leaseType.value"),
        new(["dealtype", "deal"],                                                  "basics.dealType.value"),
        new(["spaceuse", "useofpremises", "permitted"],                            "basics.spaceUse.value"),
        new(["entirebuilding"],                                                    "basics.entireBuilding.value"),
        new(["includesamendments", "amendments"],                                  "basics.includesAmendments.value"),

        // ── Dates ─────────────────────────────────────────────────────────────
        new(["leasesigndate", "signdate", "executiondate", "signeddate"],          "dates.leaseSignDate.value"),
        new(["leasestartdate", "begindate", "startdate", "leasebegindate"],        "dates.leaseStartDate.value"),
        new(["leasecommencementdate", "commencementdate", "commencement"],         "dates.leaseCommencementDate.value"),
        new(["rentcommencementdate", "rentcommencement", "rcd"],                   "dates.rentCommencementDate.value"),
        new(["leaseenddate", "enddate", "expirationdate", "expiration"],           "dates.leaseEndDate.value"),
        new(["leasetermmonths", "termmonths", "terminmonths", "term"],             "dates.leaseTermInMonths.value"),

        // ── Rent ──────────────────────────────────────────────────────────────
        new(["effectiverent", "baserent", "annualrent", "rentpersf"],             "rent.effectiveRent.value"),
        new(["annualescalation", "escalationrate", "escalation", "rentescalation"],"rent.annualEscalation.value.percent"),
        new(["tiallowance", "tenantimprovementallowance", "tenantimprovement",
             "tiamount"],                                                          "rent.tenantImprovementAllowance.value"),

        // ── Expenses ─────────────────────────────────────────────────────────
        new(["servicetype", "nettype", "leasestructure", "grossnet"],             "expenses.serviceTypeEstimate.value"),
        new(["operatingexpenses", "opex"],                                        "expenses.operatingExpenses.value"),
        new(["cam", "commonareamaintenance"],                                     "expenses.cam.value"),
        new(["insurance"],                                                        "expenses.insurance.value"),
        new(["taxes", "realestatetaxes", "propertytaxes"],                        "expenses.taxes.value"),
        new(["electricity", "electric"],                                          "expenses.electricity.value"),
        new(["gas"],                                                              "expenses.gas.value"),
        new(["water"],                                                            "expenses.water.value"),
        new(["hvac", "heating", "cooling"],                                       "expenses.hvac.value"),
        new(["cleaning", "janitorial"],                                           "expenses.cleaning.value"),
    ];

    /// <summary>
    /// Returns formItemID → extracted value for all fields that match a rule.
    /// </summary>
    public static Dictionary<int, object?> Map(JsonElement aiOutput, JsonElement[] fields)
    {
        var result = new Dictionary<int, object?>();

        foreach (var field in fields)
        {
            if (!field.TryGetProperty("formItemID", out var idEl)) continue;
            int id = idEl.GetInt32();

            var haystack = BuildHaystack(field);

            foreach (var rule in Rules)
            {
                if (Array.Exists(rule.Keys, k => haystack.Contains(k, StringComparison.Ordinal)))
                {
                    var value = NavigatePath(aiOutput, rule.Path);
                    if (value is not null)
                        result[id] = value;
                    break;
                }
            }
        }

        return result;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string BuildHaystack(JsonElement field)
    {
        static string Norm(JsonElement el, string prop) =>
            el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String
                ? Regex.Replace(v.GetString()!.ToLowerInvariant(), "[^a-z0-9]", "")
                : string.Empty;

        return string.Join("|",
            Norm(field, "formItemFriendlyName"),
            Norm(field, "formItemSystemName"),
            Norm(field, "formItemLabel"),
            Norm(field, "formItemConstant"));
    }

    private static object? NavigatePath(JsonElement root, string path)
    {
        var current = root;
        foreach (var segment in path.Split('.'))
        {
            if (!current.TryGetProperty(segment, out current)) return null;
            if (current.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined) return null;
        }

        return current.ValueKind switch
        {
            JsonValueKind.String => current.GetString(),
            JsonValueKind.Number => current.TryGetDouble(out var d) ? (object?)d : current.GetRawText(),
            JsonValueKind.True   => true,
            JsonValueKind.False  => false,
            JsonValueKind.Array  => current.GetRawText(), // e.g. floors[]
            _                    => null,
        };
    }
}
