export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor() {
    super(405, "Method Not Allowed");
  }
}

export class LengthRequiredError extends HttpError {
  constructor() {
    super(411, "Length Required");
  }
}

export class ContentTooLargeError extends HttpError {
  constructor() {
    super(413, "Content Too Large");
  }
}

export class UnsupportedMediaTypeError extends HttpError {
  constructor() {
    super(415, "Unsupported Media Type");
  }
}

export class InternalServerError extends HttpError {
  constructor(message = "Internal Server Error") {
    super(500, message);
  }
}
