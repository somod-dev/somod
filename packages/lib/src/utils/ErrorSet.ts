export default class ErrorSet extends Error {
  private _errors: Error[] = [];
  constructor(errors: Error[]) {
    super(errors.map(e => e.message).join("\n"));

    this._errors = errors;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get errors(): Error[] {
    return [...this._errors];
  }
}
