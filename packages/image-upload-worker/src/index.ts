import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "api/routes/index";
import type { R2EventMessage } from "./events";

const SERVICE_NAME = "image-upload-worker";

export default {
  async queue(batch, env): Promise<void> {
    if (!env.PUBLIC_API_BASE_URL) {
      throw new Error("PUBLIC_API_BASE_URL is not defined");
    }
    if (!env.API_TOKEN) {
      throw new Error("API_TOKEN is not defined");
    }

    const client = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: env.PUBLIC_API_BASE_URL,
          headers() {
            return {
              Authorization: `Bearer ${env.API_TOKEN}`,
              "X-Service-Name": SERVICE_NAME,
            };
          },
        }),
      ],
    });

    await Promise.all(
      batch.messages.map(async (message) => {
        const { action, object } = message.body;
        if (action === "PutObject") {
          console.log(`Registering image: ${object.key}`);
          const data = await env.IMAGES.head(object.key);
          if (!data) {
            throw new Error(`Invalid object key: ${object.key}`);
          }

          const { key, size, customMetadata } = data;
          const { workspace, user } = customMetadata ?? {};
          if (typeof workspace !== "string" || !workspace) {
            throw new Error(`Object is missing workspace metadata key: ${key}`);
          }
          if (typeof user !== "string" || !user) {
            throw new Error(`Object is missing user metadata key: ${key}`);
          }

          const image = {
            key,
            bytes: size,
            workspaceId: workspace,
            userId: user,
          };

          return client.media.registerImage.mutate(image);
        }
      }),
    );
  },
} satisfies ExportedHandler<Env, R2EventMessage>;
