import assert from "node:assert";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export interface Email {
  subject: string;
  body: string;
}

let client: SESv2Client | null = null;

/** Whether the SES credentials needed to send email are configured. */
export function isEmailEnabled() {
  return Boolean(
    process.env.EMAIL_FROM &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION,
  );
}

function getClient() {
  if (client) {
    return client;
  }

  assert(process.env.AWS_ACCESS_KEY_ID, "AWS_ACCESS_KEY_ID is required");
  assert(process.env.AWS_SECRET_ACCESS_KEY, "AWS_SECRET_ACCESS_KEY is required");
  assert(process.env.AWS_REGION, "AWS_REGION is required");

  client = new SESv2Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return client;
}

export async function sendEmail(recipient: string, message: Email) {
  assert(process.env.EMAIL_FROM, "EMAIL_FROM is required");

  const client = getClient();
  const command = new SendEmailCommand({
    FromEmailAddress: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [recipient],
    },
    Content: {
      Simple: {
        Subject: {
          Data: message.subject,
        },
        Body: {
          Html: {
            Data: message.body,
          },
        },
      },
    },
  });
  await client.send(command);
}
