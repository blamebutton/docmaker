export class UserError extends Error {
  constructor(message: string) {
    super(message);
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, UserError.prototype);
  }
}

export class ProjectFileException extends UserError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ProjectFileException.prototype);
  }
}
