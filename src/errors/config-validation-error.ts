import UserError from './user-error.js';
import {ValidationError} from 'class-validator';

export default class ConfigValidationError extends UserError {
  constructor(errors: ValidationError[]) {
    const messages = errors
      .map(e => {
        const property = e.property;
        const value = e.value;
        const constraints = Object.values(e.constraints).map(v => `\t\t* ${v}`).join('\n');
        return `\t* Property: "${property}" = "${value}"\n${constraints}`;
      })
      .join('\n');
    super(`config validation:\n\n${messages}\n`);
    Object.setPrototypeOf(this, ConfigValidationError.prototype);
  }
}
