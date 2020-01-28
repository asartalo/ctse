const ctseAvailability = require('./ctseAvailability.js');
const seAvailability = require('./seAvailability.js');

function assertions(chai) {
  const { Assertion } = chai;

  Assertion.addMethod('available', function availableFn() {
    const {
      available, logs, message, noMessage, type,
    } = this._obj;
    if (
      (!available && !this.__flags.negate)
      || (available && !!this.__flags.negate)
    ) {
      console.log.apply(null, logs); // eslint-disable-line no-console
    }

    this.assert(
      !!available,
      `${type}: ${message}`,
      `${type}: ${noMessage}`,
    );
  });
}

assertions.ctseAvailability = ctseAvailability;
assertions.seAvailability = seAvailability;

module.exports = assertions;
