/* eslint-disable no-console */

const { IPC } = require('node-ipc');
const Selenium = require('./Selenium');
const SeleniumBackground = require('./SeleniumBackground');
const NullSelenium = require('./NullSelenium');
const CtSe = require('./CtSe');
const Server = require('./Server.js');
const { createLogger, createSeleniumChecker } = require('./cliHelpers.js');

const binder = (that, ...methods) => methods.forEach(method => {
  that[method] = that[method].bind(that); /* eslint-disable-line no-param-reassign */
});

class CLI {
  /**
   * @param {CtSe} app - CtSe application instance
   * @param {process} process - The node js process
   */
  constructor(app, process) {
    this.app = app;
    this.process = process;
    binder(this, 'exitProcessFn', 'watchProcess', 'start');
  }

  /**
   * @param {string} msg - The message to be sent
   * @returns {Function} - an exit process listener
   */
  exitProcessFn(msg) {
    const { process, app } = this;
    return () => app.stop().then(() => {
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
    const { watchProcess, app } = this;
    watchProcess();
    return app.start();
  }
}

CLI.create = ({ foreground, se = true }) => {
  let runner;
  if (se) {
    const SeleniumRunner = foreground ? Selenium : SeleniumBackground;
    const seReady = createSeleniumChecker(foreground);
    const logger = createLogger(seReady);
    runner = new SeleniumRunner(__dirname, { logger });
  } else {
    runner = new NullSelenium();
  }

  const ipc = new IPC();
  ipc.config.id = 'ctse';
  ipc.config.retry = 1500;
  const commandServer = new Server(ipc);
  const app = new CtSe(commandServer, runner);

  return new CLI(app, process);
};

module.exports = CLI;
