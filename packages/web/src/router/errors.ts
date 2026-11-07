export interface HttpErrorOptions extends ErrorOptions {
  headers?: HeadersInit;
}

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
