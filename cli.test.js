const { expect, use } = require('chai');
const ctsnAssertions = require('./support/ctsnAssertions.js');
const shellRunner = require('./lib/shellRunner.js');

const { ctsnAvailability, snAvailability } = ctsnAssertions;
const cliTimeout = 40000;

use(ctsnAssertions);

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
      const availability = await snAvailability('localhost:4444');
      expect(availability).to.be.available();
    });

    it('runs ctsn server', async function () {
      this.timeout(cliTimeout);
      const availability = await ctsnAvailability();
      expect(availability).to.be.available();
    });

    describe('when the cli script is stoppped', () => {
      beforeEach(() => {
        cmd.kill();
        cmd = null;
      });

      it('does not run ctsn server', async function () {
        this.timeout(cliTimeout);
        const availability = await ctsnAvailability();
        expect(availability).not.to.be.available();
      });

      it('does not run selenium docker', async function () {
        this.timeout(cliTimeout);
        const availability = await snAvailability('localhost:4444');
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
