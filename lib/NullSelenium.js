class NullSelenium {
  start() {
    return Promise.resolve(null);
  }

  stop() {
    return Promise.resolve(null);
  }
}

module.exports = NullSelenium;
