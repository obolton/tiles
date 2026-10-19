import { describe, expect, test, vi, afterEach } from "vitest";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { sendEmail, isEmailEnabled } from "../email";

const send = vi.fn(() => Promise.resolve());

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: class {
    send = send;
  },
  SendEmailCommand: class {
    constructor(public input: SendEmailCommandInput) {}
  },
}));

describe("sendEmail", () => {
  test("sends an email", async () => {
    await sendEmail("recipient@example.com", {
      subject: "Email subject",
      body: "Email body",
    });

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
});

describe("isEmailEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("is enabled when the sender and SES credentials are configured", () => {
    expect(isEmailEnabled()).toBe(true);
  });

  test.each(["EMAIL_FROM", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"])(
    "is disabled when %s is missing",
    (name) => {
      vi.stubEnv(name, "");

      expect(isEmailEnabled()).toBe(false);
    },
  );
});
