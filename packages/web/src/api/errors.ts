import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "api/routes/index";

type APIError = TRPCClientError<AppRouter>;
type APIErrorCode = NonNullable<APIError["data"]>["code"];

function isAPIError(error: unknown): error is APIError {
  return error instanceof TRPCClientError;
}

/** Whether an API call was rejected with the given error code. */
export function isAPIErrorCode(error: unknown, code: APIErrorCode) {
  return isAPIError(error) && error.data?.code === code;
}
