const { expect, use } = require('chai');
const wait = require('@sprnz/wait');
const ctSeAssertions = require('./support/ctSeAssertions.js');
const shellRunner = require('../lib/shellRunner.js');

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

describe('cli end to end tests @slow', () => {
  let cmd;
  let cmdPromise;
  let logger;

  describe('When it is invoked to run selenium in the background @docker', () => {
    beforeEach(() => {
      logger = createLogger();
      cmd = shellRunner('./cli.js', [], { shell: true, logger });
      cmdPromise = cmd.run();
    });

    afterEach(async function () {
      this.timeout(cliTimeout);
      const result = cmd && (await cmd.kill());
      await wait(5000);
      return result;
    });

    it('does not generate errors', async function () {
      this.timeout(cliTimeout);
      await new Promise(resolve => {
        logger.observe(str => {
          if ([...str.matchAll(/CtSe: Selenium Server Ready/g)].length > 0) {
            resolve();
          }
        });
        setTimeout(() => resolve, 5000);
      });
      await cmd.kill();
      cmd = null;

      let result;
      try {
        result = await cmdPromise;
      } catch (e) {
        throw Error(`Unhandled error ${e.message}`);
      }

      if (result.stderr !== '') {
        throw Error(`Script has errors ${result.stderr}`);
      }

      if (result.code > 0) {
        throw Error(`Script returned code ${result.code} with output: ${result.stdout}`);
      }
    });

    it('runs selenium docker', async function () {
      this.timeout(cliTimeout);
      const availability = await seAvailability('localhost:4444', { logger, timeout: cliTimeout });
      expect(availability).to.be.available();
    });

    it('runs ctse server', async function () {
      this.timeout(cliTimeout);
      const availability = await ctSeAvailability(cliTimeout);
      expect(availability).to.be.available();
    });

    describe('when the cli script is stopped', () => {
      beforeEach(async function () {
        this.timeout(cliTimeout);
        await cmd.kill();
        cmd = null;
        await wait(5000);
      });

      it('does not run ctse server', async function () {
        this.timeout(cliTimeout);
        const availability = await ctSeAvailability(cliTimeout);
        expect(availability).not.to.be.available();
      });

      it('does not run selenium docker', async function () {
        this.timeout(cliTimeout);
        const availability = await seAvailability('localhost:4444', {
          logger,
          timeout: cliTimeout,
        });
        expect(availability).not.to.be.available();
      });
    });
  });

  describe('When it is invoked to run selenium in the foreground', () => {
    beforeEach(() => {
      logger = createLogger();
      cmd = shellRunner('./cli.js', ['-f'], { shell: true, logger });
      cmdPromise = cmd.run();
    });

    afterEach(async function () {
      this.timeout(cliTimeout);
      if (cmd) {
        await cmd.kill();
        await wait(5000);
      }
    });

    it('runs selenium in the foreground', async function () {
      this.timeout(cliTimeout);
      const availability = await seAvailability('localhost:4444', {
        foreground: true,
        logger,
        timeout: cliTimeout,
      });
      expect(availability).to.be.available();
    });

    describe('when the cli script is stoppped', () => {
      beforeEach(async function () {
        this.timeout(cliTimeout);
        await cmd.kill();
        await wait(5000);
      });

      it('does not run selenium in the foreground', async function () {
        this.timeout(cliTimeout);
        const availability = await seAvailability('localhost:4444', {
          foreground: true,
          logger,
          timeout: cliTimeout,
        });
        expect(availability).not.to.be.available();
      });
    });
  });
});
