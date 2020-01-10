const { IPC } = require('node-ipc');
const { logger, outputLogs } = require('./customLogger.js');
const Availability = require('./Availability.js');

module.exports = function ctsnAvailability() {
  const ipc = new IPC();
  ipc.config.logger = logger;
  ipc.config.maxRetries = 5;
  ipc.config.retry = 100;

  return new Promise(resolve => {
    const availability = new Availability('ctsnServer');

    setTimeout(() => {
      resolve(availability.set({
        message: 'Attempt to connect to ctsn server timed out',
        logs: outputLogs(),
      }));
    }, 500);

    ipc.connectTo('ctsn', () => {
      if (!ipc.of.ctsn) {
        resolve(availability.set({
          message: 'Unable to connect to ctsn server',
          logs: outputLogs(),
        }));
      }

      ipc.of.ctsn.on('connect', () => {
        ipc.disconnect('ctsn');
        resolve(availability.set({
          available: true,
        }));
      });
    });
  });
};
