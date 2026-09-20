import { describe, expect, it, vi } from "vitest";
import { AiProviderError } from "./ai-provider";
import { GeminiProvider, MAX_PROVIDER_RESPONSE_BYTES } from "./gemini-provider";

const signal = new AbortController().signal;

describe("Gemini provider adapter", () => {
  it("uses server headers, separated instructions, JSON schema, and usage mapping", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ totalTokens: 12 }))
      .mockResolvedValueOnce(
        Response.json({
          candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
          usageMetadata: {
            promptTokenCount: 12,
            candidatesTokenCount: 4,
            totalTokenCount: 16,
          },
        }),
      );
    const provider = new GeminiProvider(
      "gemini-test",
      "secret-key",
      1_000,
      fetcher,
    );
    expect(await provider.countTokens("untrusted", signal)).toBe(12);
    const result = await provider.generateAnalysis({
      systemInstruction: "trusted instructions",
      userContent: "untrusted document",
      jsonSchema: { type: "object" },
      signal,
    });
    expect(result).toEqual({
      jsonText: '{"ok":true}',
      usage: { inputTokens: 12, outputTokens: 4, totalTokens: 16 },
    });
    const [url, init] = fetcher.mock.calls[1];
    expect(String(url)).not.toContain("secret-key");
    expect(new Headers(init?.headers).get("x-goog-api-key")).toBe("secret-key");
    const body = JSON.parse(String(init?.body));
    expect(body.systemInstruction.parts[0].text).toBe("trusted instructions");
    expect(body.contents[0].parts[0].text).toBe("untrusted document");
    expect(body.generationConfig).toMatchObject({
      temperature: 0,
      responseMimeType: "application/json",
      responseJsonSchema: { type: "object" },
    });
  });

  it.each([
    [401, "configuration", false],
    [429, "rate_limited", true],
    [503, "unavailable", true],
    [400, "failed", false],
  ] as const)(
    "maps HTTP %i without exposing response content",
    async (status, kind, retryable) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response("private provider details and secret-key", { status }),
        );
      const provider = new GeminiProvider(
        "gemini-test",
        "secret-key",
        1_000,
        fetcher,
      );
      await expect(provider.countTokens("text", signal)).rejects.toMatchObject({
        kind,
        retryable,
        message: "AI provider request failed",
      });
    },
  );

  it("rejects oversized responses before parsing", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("{}", {
        headers: { "Content-Length": String(MAX_PROVIDER_RESPONSE_BYTES + 1) },
      }),
    );
    const provider = new GeminiProvider(
      "gemini-test",
      "secret-key",
      1_000,
      fetcher,
    );
    await expect(provider.countTokens("text", signal)).rejects.toBeInstanceOf(
      AiProviderError,
    );
  });

  it("uses null rather than zero when provider usage is absent", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        candidates: [{ content: { parts: [{ text: "{}" }] } }],
      }),
    );
    const provider = new GeminiProvider(
      "gemini-test",
      "secret-key",
      1_000,
      fetcher,
    );
    const result = await provider.generateAnalysis({
      systemInstruction: "system",
      userContent: "data",
      jsonSchema: {},
      signal,
    });
    expect(result.usage).toEqual({
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    });
  });
});
