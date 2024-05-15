import Fastify from "fastify";

const fastify = Fastify({ logger: true });

fastify.get("/", async (request, reply) => {
  reply.send({ hello: "world" });
});

fastify.listen({ port: 3000 }, (error, address) => {
  if (error) {
    fastify.log.error(error);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
