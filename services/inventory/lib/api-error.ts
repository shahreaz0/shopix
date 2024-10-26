export class ApiError extends Error {
  public statusCode: number;
  public meta: object;

  constructor(message: string, statusCode: number, meta = {}) {
    super(message);
    this.statusCode = statusCode;
    this.meta = meta;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the name to the class name
    this.name = this.constructor.name;
  }
}
