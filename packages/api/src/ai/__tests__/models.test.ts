import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createLanguageModel } from "../models";

beforeEach(() => {
  // Provider modules read their API key on load, so evaluate them afresh per test.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createLanguageModel", () => {
  test("creates an OpenAI model", async () => {
    expect(await createLanguageModel("openai", "gpt-5.2")).toMatchObject({
      provider: expect.stringContaining("openai"),
      modelId: "gpt-5.2",
    });
  });

  test("throws when the selected provider's key is missing", async () => {
    await expect(createLanguageModel("anthropic", "claude-sonnet-4-5")).rejects.toThrow(
      "Missing environment variable: ANTHROPIC_API_KEY",
    );
  });

  test("creates an Anthropic model when its key is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test");

    expect(await createLanguageModel("anthropic", "claude-sonnet-4-5")).toMatchObject({
      provider: expect.stringContaining("anthropic"),
      modelId: "claude-sonnet-4-5",
    });
  });

  test("creates a Google model when its key is set", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test");

    expect(await createLanguageModel("google", "gemini-2.5-pro")).toMatchObject({
      provider: expect.stringContaining("google"),
      modelId: "gemini-2.5-pro",
    });
  });

  test("throws for an unsupported provider", async () => {
    await expect(createLanguageModel("foo", "bar")).rejects.toThrow("Unsupported AI_TEXT_PROVIDER");
  });
});
