/* eslint-disable no-console */

const { IPC } = require('node-ipc');
const Selenium = require('./Selenium');
const SeleniumBackground = require('./SeleniumBackground');
const CtSe = require('./CtSe');
const Server = require('./Server.js');
const { createLogger, createSeleniumChecker } = require('./cliHelpers.js');

const binder = (that, ...methods) => methods.forEach(method => {
  that[method] = that[method].bind(that); /* eslint-disable-line no-param-reassign */
});

class CLI {
  /**
   * @param {CtSe} app - CtSe application instance
   * @param {Selenium|SeleniumBackground} runner - Selenium runner
   * @param {process} process - The node js process
   */
  constructor(app, runner, process) {
    this.app = app;
    this.runner = runner;
    this.process = process;
    binder(this, 'exitProcessFn', 'watchProcess', 'start');
  }

  /**
   * @param {string} msg - The message to be sent
   * @returns {Function} - an exit process listener
   */
  exitProcessFn(msg) {
    const { process, runner } = this;
    return () => runner.stop().then(() => {
      console.log(msg);
      return process.exit();
    });
  }

  /**
   * Listen to process events
   */
  watchProcess() {
    const { process, exitProcessFn } = this;
    ['beforeExit', 'SIGINT', 'SIGTERM'].forEach(event => {
      process.on(event, exitProcessFn(`STOPPED WITH ${event}`));
    });
  }

  /**
   * Start the CtSe app
   */
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
  const ipc = new IPC();
  ipc.config.id = 'ctse';
  ipc.config.retry = 1500;
  const commandServer = new Server(ipc);
  const app = new CtSe(commandServer);

  return new CLI(app, runner, process);
};

module.exports = CLI;
