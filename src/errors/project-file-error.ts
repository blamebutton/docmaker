import UserError from './user-error';

export default class ProjectFileError extends UserError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ProjectFileError.prototype);
  }
}
