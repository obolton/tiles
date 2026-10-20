import { afterEach, describe, expect, test, vi } from "vitest";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { sendEmail } from "../email";

const { send, createClient } = vi.hoisted(() => ({
  send: vi.fn(async () => {}),
  createClient: vi.fn(),
}));

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: class {
    send = send;
    constructor(config: unknown) {
      createClient(config);
    }
  },
  SendEmailCommand: class {
    constructor(public input: SendEmailCommandInput) {}
  },
}));

const EMAIL = { subject: "Email subject", body: "Email body" };

async function loadModule() {
  vi.resetModules();
  return import("@/utils/email");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendEmail", () => {
  test("sends an email", async () => {
    await sendEmail("recipient@example.com", EMAIL);

    expect(send).toHaveBeenCalledWith(
      new SendEmailCommand({
        FromEmailAddress: "from@test.com",
        Destination: {
          ToAddresses: ["recipient@example.com"],
        },
        Content: {
          Simple: {
            Subject: {
              Data: "Email subject",
            },
            Body: {
              Html: {
                Data: "Email body",
              },
            },
          },
        },
      }),
    );
  });

  test("propagates send failures", async () => {
    send.mockRejectedValueOnce(new Error("SES unavailable"));

    await expect(sendEmail("recipient@example.com", EMAIL)).rejects.toThrow("SES unavailable");
  });

  test("requires EMAIL_FROM", async () => {
    vi.stubEnv("EMAIL_FROM", "");

    await expect(sendEmail("recipient@example.com", EMAIL)).rejects.toThrow(
      "EMAIL_FROM is required",
    );
    expect(send).not.toHaveBeenCalled();
  });

  describe("client", () => {
    test("creates one client from the AWS credentials and reuses it", async () => {
      const email = await loadModule();

      await email.sendEmail("first@example.com", EMAIL);
      await email.sendEmail("second@example.com", EMAIL);

      expect(createClient).toHaveBeenCalledExactlyOnceWith({
        region: "test",
        credentials: { accessKeyId: "test", secretAccessKey: "test" },
      });
      expect(send).toHaveBeenCalledTimes(2);
    });

    test.each(["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"])(
      "requires %s",
      async (name) => {
        const email = await loadModule();
        vi.stubEnv(name, "");

        await expect(email.sendEmail("recipient@example.com", EMAIL)).rejects.toThrow(
          `${name} is required`,
        );
        expect(createClient).not.toHaveBeenCalled();
      },
    );
  });
});
