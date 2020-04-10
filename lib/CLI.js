const Selenium = require('./Selenium');
const SeleniumBackground = require('./SeleniumBackground');
const CtSe = require('./CtSe');
const { createLogger, createSeleniumChecker } = require('./cliHelpers.js');

const binder = (that, ...methods) => methods.forEach(method => {
  that[method] = that[method].bind(that);
});

class CLI {
  constructor(app, runner, process) {
    this.app = app;
    this.runner = runner;
    this.process = process;
    binder(this, 'exitProcessFn', 'watchProcess', 'start');
  }

  exitProcessFn(msg) {
    const { process, runner } = this;
    return () => runner.stop().then(() => {
      console.log(msg);
      return process.exit();
    });
  }

  watchProcess() {
    const { process, runner, exitProcessFn } = this;
    ['beforeExit', 'SIGINT', 'SIGTERM'].forEach(event => {
      process.on(event, exitProcessFn(`STOPPED WITH ${event}`));
    });
  }

  start() {
    const { watchProcess, app, runner } = this;
    watchProcess();
    runner.start();
    app.start();
  }
}

CLI.create = ({ foreground }) => {
  const SeleniumRunner = foreground ? Selenium : SeleniumBackground;
  const seReady = createSeleniumChecker(foreground);
  const logger = createLogger(seReady);
  const runner = new SeleniumRunner(__dirname, { logger });
  const app = CtSe.create();

  return new CLI(app, runner, process);
};

module.exports = CLI;
