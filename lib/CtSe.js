class CtSe {
  /**
   * @param {Server} runner - App server
   * @param {Selenium|SeleniumBackground} runner - Selenium runner
   */
  constructor(server, runner) {
    this.server = server;
    this.runner = runner;
  }

  start() {
    this.runner.start();
    this.server.start();
  }

  stop() {
    this.server.stop();
    return this.runner.stop();
  }
}

module.exports = CtSe;
