import { createGoogle } from "@ai-sdk/google";
import { googleEnv } from "@/env";

export const google = createGoogle({ apiKey: googleEnv.GOOGLE_GENERATIVE_AI_API_KEY });
