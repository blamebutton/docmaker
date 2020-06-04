import UserError from './user-error';
import {ValidationError as JoiValidationError} from 'hapi__joi';

export default class ValidationError extends UserError {
  constructor(error: JoiValidationError) {
    super(`config validation: ${error.message}`);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
