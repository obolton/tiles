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
