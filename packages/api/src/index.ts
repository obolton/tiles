import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import router from "./router/index.ts";

const PORT = parseInt(process.env.PORT || "", 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const USER_ID = process.env.USER_ID;

if (!PORT) {
  throw new Error("PORT environment variable is not set");
}

if (Number.isNaN(PORT)) {
  throw new Error("PORT environment variable is invalid");
}

if (!CLIENT_ORIGIN) {
  throw new Error("CLIENT_ORIGIN environment variable is not set");
}

if (!USER_ID) {
  throw new Error("USER_ID environment variable is not set");
}

createHTTPServer({
  router,
  middleware: cors({
    origin: CLIENT_ORIGIN,
  }),
  createContext() {
    return {
      userId: USER_ID,
    };
  },
}).listen(PORT);
