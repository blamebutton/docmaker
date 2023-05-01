import UserError from './user-error.js';

export default class MissingConfigError extends UserError {
  constructor() {
    super('Could not find config file.');
    Object.setPrototypeOf(this, MissingConfigError.prototype);
  }
}
