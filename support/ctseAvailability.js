const { IPC } = require('node-ipc');
const { logger, outputLogs } = require('./customLogger.js');
const Availability = require('./Availability.js');

module.exports = function ctseAvailability() {
  const ipc = new IPC();
  ipc.config.logger = logger;
  ipc.config.maxRetries = 5;
  ipc.config.retry = 100;

  return new Promise(resolve => {
    const availability = new Availability('ctseServer');

    setTimeout(() => {
      resolve(availability.set({
        message: 'Attempt to connect to ctse server timed out',
        logs: outputLogs(),
      }));
    }, 1000);

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
          available: true,
        }));
      });
    });
  });
};
