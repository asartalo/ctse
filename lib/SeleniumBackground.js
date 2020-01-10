const shellRunner = require('./shellRunner.js');

class SeleniumBackground {
  constructor(cwd, options = {}) {
    this.file = 'docker-compose-selenium.yml';
    this.cwd = cwd;
    this.logger = options.logger ? options.logger : false;
  }

  dockerComposeSelenium(args = []) {
    const cmd = shellRunner(
      'docker-compose',
      ['-f', './docker-compose-selenium.yml', ...args],
      { shell: true, logger: this.logger },
    );
    return cmd.run();
  }

  start() {
    return this.dockerComposeSelenium(['up', '-d']);
  }

  stop() {
    return this.dockerComposeSelenium(['down']);
  }
}

module.exports = SeleniumBackground;
