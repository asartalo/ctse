const ctsnAvailability = require('./ctsnAvailability.js');
const snAvailability = require('./snAvailability.js');

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

assertions.ctsnAvailability = ctsnAvailability;
assertions.snAvailability = snAvailability;

module.exports = assertions;
