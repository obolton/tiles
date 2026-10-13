import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

export function createRequest(headers: IncomingMessage["headers"] = {}) {
  const req = new IncomingMessage(new Socket());
  req.headers = headers;
  return req;
}

export function createResponse() {
  return new ServerResponse(createRequest());
}
