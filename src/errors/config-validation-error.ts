import UserError from './user-error';
import {ValidationError} from 'class-validator';

export default class ConfigValidationError extends UserError {
  constructor(errors: ValidationError[]) {
    const messages = errors
      .map(e => `validation error on ${e.property} with value '${e.value}'`)
      .join('\n');
    super(`config validation: ${messages}`);
    Object.setPrototypeOf(this, ConfigValidationError.prototype);
  }
}
