import { describe, expect, test, vi } from "vitest";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { sendEmail } from "../email";

const { send, clients } = vi.hoisted(() => ({
  send: vi.fn(async () => {}),
  clients: [] as unknown[],
}));

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: class {
    send = send;
    constructor(config: unknown) {
      clients.push(config);
    }
  },
  SendEmailCommand: class {
    constructor(public input: SendEmailCommandInput) {}
  },
}));

const EMAIL = { subject: "Email subject", body: "Email body" };

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

  test("creates a single client from the AWS credentials", async () => {
    await sendEmail("first@example.com", EMAIL);
    await sendEmail("second@example.com", EMAIL);

    expect(clients).toEqual([
      {
        region: "test",
        credentials: { accessKeyId: "test", secretAccessKey: "test" },
      },
    ]);
    expect(send).toHaveBeenCalledTimes(2);
  });

  test("propagates send failures", async () => {
    send.mockRejectedValueOnce(new Error("SES unavailable"));

    await expect(sendEmail("recipient@example.com", EMAIL)).rejects.toThrow("SES unavailable");
  });
});
