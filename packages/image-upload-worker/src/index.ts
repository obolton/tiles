export default {
  async queue(batch, env): Promise<void> {
    for (const message of batch.messages) {
      console.log(`Message ${message.id}: ${JSON.stringify(message.body)}`);
    }
  },
} satisfies ExportedHandler<Env, Error>;
