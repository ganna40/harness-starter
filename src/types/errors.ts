export class AppError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super("NOT_FOUND", `${resource} not found: ${id}`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(reason: string) {
    super("UNAUTHORIZED", reason);
  }
}

export class ValidationError extends AppError {
  constructor(reason: string) {
    super("VALIDATION", reason);
  }
}
