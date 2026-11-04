import { afterEach, describe, expect, test, vi } from "vitest";
import { createLanguageModel } from "../models";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createLanguageModel", () => {
  test("creates an OpenAI model", () => {
    expect(createLanguageModel("openai:gpt-5.2")).toMatchObject({
      provider: expect.stringContaining("openai"),
      modelId: "gpt-5.2",
    });
  });

  test("creates an Anthropic model when its key is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test");

    expect(createLanguageModel("anthropic:claude-sonnet-4-5")).toMatchObject({
      provider: expect.stringContaining("anthropic"),
      modelId: "claude-sonnet-4-5",
    });
  });

  test("creates a Google model when its key is set", () => {
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test");

    expect(createLanguageModel("google:gemini-2.5-pro")).toMatchObject({
      provider: expect.stringContaining("google"),
      modelId: "gemini-2.5-pro",
    });
  });

  test("keeps colons in the model id", () => {
    expect(createLanguageModel("openai:ft:gpt-4.1:org:tiles")).toMatchObject({
      modelId: "ft:gpt-4.1:org:tiles",
    });
  });

  test("throws when the selected provider's key is missing", () => {
    expect(() => createLanguageModel("anthropic:claude-sonnet-4-5")).toThrow(
      "ANTHROPIC_API_KEY is not defined",
    );
  });

  test("throws for an unsupported provider", () => {
    expect(() => createLanguageModel("foo:bar")).toThrow("Unsupported AI_TEXT_MODEL provider");
  });

  test("throws when the model id is missing", () => {
    expect(() => createLanguageModel("openai:")).toThrow("Invalid AI_TEXT_MODEL");
    expect(() => createLanguageModel("openai")).toThrow("Invalid AI_TEXT_MODEL");
  });
});
