using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace FormsEngine.Application.Ai;

public interface IFormFieldsClient
{
    Task<(JsonElement[] Fields, JsonElement[] Sections)> GetFieldsAsync(
        int formId, int objectTypeId, string bearerToken, CancellationToken cancellationToken);
}

public class FormFieldsClient : IFormFieldsClient
{
    readonly HttpClient _http;

    public FormFieldsClient(HttpClient http)
    {
        _http = http;
    }

    public async Task<(JsonElement[] Fields, JsonElement[] Sections)> GetFieldsAsync(
        int formId, int objectTypeId, string bearerToken, CancellationToken cancellationToken)
    {
        // ── 1. Sections ──────────────────────────────────────────────────────
        using var secReq = new HttpRequestMessage(
            HttpMethod.Get,
            $"AdminForms/GetFormSections/{formId}/0/0");
        secReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        using var secRes = await _http.SendAsync(secReq, cancellationToken);
        secRes.EnsureSuccessStatusCode();

        using var secDoc = await JsonDocument.ParseAsync(
            await secRes.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        var sections = secDoc.RootElement
            .GetProperty("data")
            .EnumerateArray()
            .Select(e => e.Clone())
            .ToArray();

        // ── 2. Fields for all sections ───────────────────────────────────────
        var body = new StringContent(
            JsonSerializer.Serialize(sections),
            Encoding.UTF8,
            "application/json");

        using var fldReq = new HttpRequestMessage(
            HttpMethod.Post,
            $"AdminForms/GetFormFieldsForAllSections/{formId}/{objectTypeId}")
        {
            Content = body,
        };
        fldReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        using var fldRes = await _http.SendAsync(fldReq, cancellationToken);
        fldRes.EnsureSuccessStatusCode();

        using var fldDoc = await JsonDocument.ParseAsync(
            await fldRes.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        var fields = fldDoc.RootElement
            .GetProperty("data")
            .EnumerateArray()
            .Select(e => e.Clone())
            .ToArray();

        return (fields, sections);
    }
}
