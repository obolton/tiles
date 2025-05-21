import respond from "./server";

export default {
  fetch(request: Request) {
    return respond(request);
  },
};
