import UserError from './user-error';

export default class MissingConfigError extends UserError {
  constructor() {
    super('Could not find config file.');
    Object.setPrototypeOf(this, MissingConfigError.prototype);
  }
}
