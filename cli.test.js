const { expect, use } = require('chai');
const ctSeAssertions = require('./support/ctSeAssertions.js');
const shellRunner = require('./lib/shellRunner.js');

const { ctSeAvailability, seAvailability } = ctSeAssertions;
const cliTimeout = parseFloat(process.env.CTSE_E2E_TIMEOUT) || 40000;

const VERBOSE = !!process.env.CTSE_E2E_VERBOSE;
function vblog(...args) {
  if (VERBOSE) {
    console.log.apply(null, args); // eslint-disable-line no-console
  }
}

use(ctSeAssertions);

function createLogger() {
  const observers = [];
  const logged = [];
  function logger(data) {
    const toLog = `${data}`.trimEnd(/[\r\n]/);
    vblog(toLog);
    logged.push(toLog);
    observers.forEach(observer => observer(toLog, logged));
  }

  logger.observe = observer => {
    observers.push(observer);
    observer(logged.join('\n'), logged);
  };

  return logger;
}

describe('cli end to end tests', () => {
  let cmd;
  let cmdPromise;
  let logger;

  describe('When it is invoked', () => {
    beforeEach(() => {
      logger = createLogger();
      cmd = shellRunner('./cli.js', [], { shell: true, logger });
      cmdPromise = cmd.run();
    });

    afterEach(function () {
      this.timeout(cliTimeout);
      return new Promise(resolve => {
        if (cmd) {
          cmd.kill();
          setTimeout(resolve, 0.125 * cliTimeout);
        } else {
          resolve();
        }
      });
    });

    it('does not generate errors', function () {
      this.timeout(cliTimeout);
      setTimeout(() => {
        cmd.kill();
        cmd = null;
      }, 5000);

      return new Promise((resolve, reject) => {
        cmdPromise.then(result => {
          if (result.stderr !== '') {
            reject(Error(`Script has errors ${result.stderr}`));
            return;
          }

          if (result.code > 0) {
            reject(Error(`Script returned code ${result.code} with output: ${result.stdout}`));
            return;
          }
          resolve();
        }).catch(e => {
          Error(`Unhandled error ${e.message}`);
        });
      });
    });

    it('runs selenium docker', async function () {
      this.timeout(cliTimeout);
      const availability = await seAvailability('0.0.0.0:4444', { logger, timeout: cliTimeout });
      expect(availability).to.be.available();
    });

    it('runs ctse server', async function () {
      this.timeout(cliTimeout);
      const availability = await ctSeAvailability(cliTimeout);
      expect(availability).to.be.available();
    });

    describe('when the cli script is stoppped', () => {
      beforeEach(() => {
        cmd.kill();
        cmd = null;
      });

      it('does not run ctse server', async function () {
        this.timeout(cliTimeout);
        const availability = await ctSeAvailability(cliTimeout);
        expect(availability).not.to.be.available();
      });

      it('does not run selenium docker', async function () {
        this.timeout(cliTimeout);
        const availability = await seAvailability('localhost:4444', { logger, timeout: cliTimeout });
        expect(availability).not.to.be.available();
      });
    });
  });

  describe('When it is invoked to foreground', () => {
    beforeEach(() => {
      logger = createLogger();
      cmd = shellRunner('./cli.js', ['-f'], { shell: true, logger });
      cmdPromise = cmd.run();
    });

    afterEach(function () {
      this.timeout(cliTimeout);
      return new Promise(resolve => {
        if (cmd) {
          cmd.kill();
          setTimeout(resolve, 0.125 * cliTimeout);
        } else {
          resolve();
        }
      });
    });

    it('runs selenium in the foreground', async function () {
      this.timeout(cliTimeout);
      const availability = await seAvailability('localhost:4444', { foreground: true, logger, timeout: cliTimeout });
      expect(availability).to.be.available();
    });

    describe('when the cli script is stoppped', () => {
      beforeEach(() => {
        cmd.kill();
        cmd = null;
      });

      it('does not run selenium in the foreground', async function () {
        this.timeout(cliTimeout);
        const availability = await seAvailability('localhost:4444', { foreground: true, logger, timeout: cliTimeout });
        expect(availability).not.to.be.available();
      });
    });
  });
});
