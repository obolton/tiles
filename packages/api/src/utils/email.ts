import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { env } from "@/env";

export interface Email {
  subject: string;
  body: string;
}

let client: SESv2Client | null = null;

function getClient() {
  if (client) {
    return client;
  }

  client = new SESv2Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  return client;
}

export async function sendEmail(recipient: string, message: Email) {
  const client = getClient();
  const command = new SendEmailCommand({
    FromEmailAddress: env.EMAIL_FROM,
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
