export interface HttpErrorOptions extends ErrorOptions {
  /** Headers to include in the error response, such as cookies to clear. */
  headers?: HeadersInit;
}

/**
 * Thrown by middleware, loaders and request handlers to respond with an error status. The server
 * renders the error route for the status (e.g. `routes/404.ts`) if one exists.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly headers: Headers;

  constructor(status: number, message: string, options?: HttpErrorOptions) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
    this.headers = new Headers(options?.headers);
  }
}

export class ForbiddenError extends HttpError {
  constructor(options?: HttpErrorOptions) {
    super(403, "Forbidden", options);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends HttpError {
  constructor(options?: HttpErrorOptions) {
    super(404, "Not Found", options);
    this.name = "NotFoundError";
  }
}

export class InternalServerError extends HttpError {
  constructor(options?: HttpErrorOptions) {
    super(500, "Internal Server Error", options);
    this.name = "InternalServerError";
  }
}
