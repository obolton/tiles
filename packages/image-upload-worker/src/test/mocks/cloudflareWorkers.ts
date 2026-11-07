// oxlint-disable node/no-process-env
// Stands in for the `cloudflare:workers` module in Node, where the bindings are the process env.
export const env = process.env;
