const shellRunner = require('./shellRunner.js');

class Selenium {
  constructor(cwd, options = {}) {
    this.cwd = cwd;
    this.logger = options.logger ? options.logger : false;
    this.cmd = null;
  }

  seleniumCommand(args = []) {
    this.cmd = shellRunner(
      'npx',
      ['selenium-standalone', 'start', ...args],
      { shell: true, logger: this.logger },
    );
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
