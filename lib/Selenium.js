const shellRunner = require('./shellRunner.js');

class Selenium {
  constructor(cwd, { logger = false, runner = shellRunner }) {
    this.cwd = cwd;
    this.logger = logger;
    this.runner = runner;
    this.cmd = null;
  }

  seleniumCommand() {
    this.cmd = this.runner('npx', ['selenium-standalone', 'start'], {
      shell: true,
      logger: this.logger,
    });
    return this.cmd.run();
  }

  start() {
    return this.seleniumCommand();
  }

  stop() {
    return new Promise(resolve => {
      this.cmd.kill();
      resolve();
    });
  }
}

module.exports = Selenium;
