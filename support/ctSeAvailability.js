const { IPC } = require('node-ipc');
const { logger, outputLogs } = require('./customLogger.js');
const Availability = require('./Availability.js');

module.exports = function ctSeAvailability(testTimeout) {
  const timeout = 0.25 * testTimeout;
  const ipc = new IPC();
  ipc.config.logger = logger;
  ipc.config.maxRetries = Math.floor(timeout / 200);
  ipc.config.retry = 200;

  return new Promise(resolve => {
    const availability = new Availability('ctSeServer');

    setTimeout(() => {
      resolve(availability.set({
        message: 'Attempt to connect to ctse server timed out',
        logs: outputLogs(),
      }));
    }, timeout);

    ipc.connectTo('ctse', () => {
      if (!ipc.of.ctse) {
        resolve(availability.set({
          message: 'Unable to connect to ctse server',
          logs: outputLogs(),
        }));
      }

      ipc.of.ctse.on('connect', () => {
        ipc.disconnect('ctse');
        resolve(availability.set({
          message: 'CtSe is available',
          available: true,
        }));
      });
    });
  });
};
