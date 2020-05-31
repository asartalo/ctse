class NullSelenium {
  // eslint-disable-next-line class-methods-use-this
  start() {
    return Promise.resolve(null);
  }

  // eslint-disable-next-line class-methods-use-this
  stop() {
    return Promise.resolve(null);
  }
}

module.exports = NullSelenium;
