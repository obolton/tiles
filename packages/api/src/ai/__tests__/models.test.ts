import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createLanguageModel } from "../models";

beforeEach(() => {
  // Provider modules assert their API key on load, so evaluate them afresh per test.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createLanguageModel", () => {
  test("creates an OpenAI model", async () => {
    expect(await createLanguageModel("openai:gpt-5.2")).toMatchObject({
      provider: expect.stringContaining("openai"),
      modelId: "gpt-5.2",
    });
  });

  test("keeps colons in the model id", async () => {
    expect(await createLanguageModel("openai:ft:gpt-4.1:org:tiles")).toMatchObject({
      modelId: "ft:gpt-4.1:org:tiles",
    });
  });

  test("throws when the selected provider's key is missing", async () => {
    await expect(createLanguageModel("anthropic:claude-sonnet-4-5")).rejects.toThrow(
      "ANTHROPIC_API_KEY is not defined",
    );
  });

  test("creates an Anthropic model when its key is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test");

    expect(await createLanguageModel("anthropic:claude-sonnet-4-5")).toMatchObject({
      provider: expect.stringContaining("anthropic"),
      modelId: "claude-sonnet-4-5",
    });
  });

  test("creates a Google model when its key is set", async () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test");

    expect(await createLanguageModel("google:gemini-2.5-pro")).toMatchObject({
      provider: expect.stringContaining("google"),
      modelId: "gemini-2.5-pro",
    });
  });

  test("throws for an unsupported provider", async () => {
    await expect(createLanguageModel("foo:bar")).rejects.toThrow(
      "Unsupported AI_TEXT_MODEL provider",
    );
  });

  test("throws when the model id is missing", async () => {
    await expect(createLanguageModel("openai:")).rejects.toThrow("Invalid AI_TEXT_MODEL");
    await expect(createLanguageModel("openai")).rejects.toThrow("Invalid AI_TEXT_MODEL");
  });
});
