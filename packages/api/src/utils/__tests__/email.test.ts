import { describe, expect, test, vi } from "vitest";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SendEmailCommandInput } from "@aws-sdk/client-sesv2";
import { sendEmail } from "../email";

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
