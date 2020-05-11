const path = require('path');
const shellRunner = require('./shellRunner.js');

const defaultComposeFile = path.resolve(path.join(__dirname, '/../docker-compose-selenium.yml'));

class SeleniumBackground {
  constructor(cwd, { logger = false, runner = shellRunner, composeFile = defaultComposeFile }) {
    this.file = composeFile;
    this.cwd = cwd;
    this.logger = logger;
    this.runner = runner;
  }

  dockerComposeSelenium(args) {
    return this.runner('docker-compose', ['-p', 'ctse', '-f', this.file, ...args], {
      shell: true,
      logger: this.logger,
    }).run();
  }

  seleniumLogs() {
    return this.runner('docker', ['logs', '-f', 'ctse_se_hub_1'], { logger: this.logger }).run();
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
