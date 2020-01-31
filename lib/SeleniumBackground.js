const path = require('path');
const shellRunner = require('./shellRunner.js');

const composeFile = path.resolve(path.join(__dirname, '/../docker-compose-selenium.yml'));

class SeleniumBackground {
  constructor(cwd, options = {}) {
    this.file = composeFile;
    this.cwd = cwd;
    this.logger = options.logger ? options.logger : false;
  }

  dockerComposeSelenium(args = []) {
    return shellRunner(
      'docker-compose',
      ['-p', 'ctse', '-f', this.file, ...args],
      { shell: true, logger: this.logger },
    ).run();
  }

  seleniumLogs() {
    return shellRunner(
      'docker',
      ['logs', '-f', 'ctse_se_hub_1'],
      { logger: this.logger },
    ).run();
  }

  start() {
    return this.dockerComposeSelenium(['up', '-d']).then(result => {
      const { code } = result;
      if (code !== 0) {
        return result;
      }

      return this.seleniumLogs();
    });
  }

  stop() {
    return this.dockerComposeSelenium(['down']);
  }
}

module.exports = SeleniumBackground;
