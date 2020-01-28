const { expect, use } = require('chai');
const ctseAssertions = require('./support/ctseAssertions.js');
const shellRunner = require('./lib/shellRunner.js');

const { ctseAvailability, seAvailability } = ctseAssertions;
const cliTimeout = 40000;

use(ctseAssertions);

describe('cli smoke tests', () => {
  describe('When it is invoked', () => {
    let cmd; let
      cmdPromise;

    beforeEach(() => {
      cmd = shellRunner('./cli.js', [], { shell: true });
      cmdPromise = cmd.run();
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
      const availability = await seAvailability('localhost:4444');
      expect(availability).to.be.available();
    });

    it('runs ctse server', async function () {
      this.timeout(cliTimeout);
      const availability = await ctseAvailability();
      expect(availability).to.be.available();
    });

    describe('when the cli script is stoppped', () => {
      beforeEach(() => {
        cmd.kill();
        cmd = null;
      });

      it('does not run ctse server', async function () {
        this.timeout(cliTimeout);
        const availability = await ctseAvailability();
        expect(availability).not.to.be.available();
      });

      it('does not run selenium docker', async function () {
        this.timeout(cliTimeout);
        const availability = await seAvailability('localhost:4444');
        expect(availability).not.to.be.available();
      });
    });

    afterEach(function () {
      this.timeout(cliTimeout);
      return new Promise(resolve => {
        if (cmd) {
          cmd.kill();
          setTimeout(resolve, 5000);
        } else {
          resolve();
        }
      });
    });
  });

  describe('When it is invoked to foregorund', () => {
    let cmd;

    beforeEach(() => {
      cmd = shellRunner('./cli.js', ['-f'], { shell: true });
    });

    it('runs selenium in the foreground', async function () {
      this.timeout(cliTimeout);
      const availability = await seAvailability('localhost:4444', { foreground: true });
      expect(availability).to.be.available();
    });

    describe('when the cli script is stoppped', () => {
      beforeEach(() => {
        cmd.kill();
        cmd = null;
      });

      it('does not run selenium in the foreground', async function () {
        this.timeout(cliTimeout);
        const availability = await seAvailability('localhost:4444', { foreground: true });
        expect(availability).not.to.be.available();
      });
    });

    afterEach(function () {
      this.timeout(cliTimeout);
      return new Promise(resolve => {
        if (cmd) {
          cmd.kill();
          setTimeout(resolve, 5000);
        } else {
          resolve();
        }
      });
    });
  });
});
