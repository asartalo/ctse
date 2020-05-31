const { expect } = require('chai');
const wait = require('@sprnz/wait');
const shellRunner = require('./shellRunner');

const race = (...args) => Promise.race(args);

describe('shellRunner()', () => {
  let runner;
  let logs;
  let errorLogs;
  let runOptions;
  let resolved;

  beforeEach(() => {
    logs = [];
    errorLogs = [];
    runOptions = {
      logger: data => logs.push(data),
      errorLogger: error => errorLogs.push(error),
    };
  });

  describe('when a command is run', () => {
    beforeEach(async () => {
      runner = shellRunner('echo', ['FOO'], runOptions);
      resolved = await runner.run();
    });

    it('executes the command', () => {
      expect(logs).to.contain('FOO\n');
    });

    it('resolves with a code', () => {
      expect(resolved.code).to.equal(0);
    });

    it('does not have errors', () => {
      expect(resolved.error).not.to.exist();
    });
  });

  describe('when a non-existent command is run', () => {
    beforeEach(() => {
      runner = shellRunner('a-non-existent-command-123');
    });

    it('throws an error', () => {
      expect(runner.run()).to.be.rejected();
    });

    it('rejects with details', () => runner.run().catch(e => {
      expect(e.details.command).to.equal('a-non-existent-command-123');
    }));
  });

  describe('when it runs a command that fails', () => {
    // TODO: Flaky tests below sometimes timing out
    beforeEach(async () => {
      runner = shellRunner('ping', ['asdfasdfasdfawdfwe.asdfasdf'], runOptions);
      resolved = await runner.run();
    });

    it('logs to errorLogger', () => {
      expect(errorLogs.length).to.be.greaterThan(0);
    });
  });

  describe('when no errorLogger is specified', () => {
    beforeEach(async () => {
      runOptions.errorLogger = null;
      runner = shellRunner('ping', ['asdfasdfasdfawdfwe.asdfasdf'], runOptions);
      resolved = await runner.run();
    });

    it('logs to default logger', () => {
      expect(logs.length).to.be.greaterThan(0);
    });
  });

  describe('when no logger is specified', () => {
    beforeEach(() => {
      runOptions.errorLogger = null;
      runOptions.logger = null;
    });

    it('resolves with stdout string', async () => {
      runner = shellRunner('echo', ['FOO'], runOptions);
      resolved = await runner.run();
      expect(resolved.stdout).to.contain('FOO');
    });

    it('rejects with stderr string', async () => {
      runner = shellRunner('ping', ['asdfasdfasdfawdfwe.asdfasdf'], runOptions);
      resolved = await runner.run();
      expect(resolved.stderr).not.to.equal('');
    });
  });

  describe('when running a long running task @slow', () => {
    beforeEach(() => {
      resolved = null;
      const script = 'let i = 0; const id = setInterval(() => console.log(i++), 10);';
      runner = shellRunner('node', ['-e', script], runOptions);
      runner.run().then(val => {
        resolved = val;
      });
    });

    afterEach(() => runner.kill());

    it('remains unresolved', async () => {
      await wait(200);
      expect(resolved).to.equal(null);
    });

    describe('when it is killed', () => {
      beforeEach(() => {
        setTimeout(runner.kill, 150);
      });

      it('finally resolves', async () => {
        let intervalId;
        const result = await race(
          wait(200),
          new Promise(resolve => {
            intervalId = setInterval(() => {
              if (resolved) {
                resolve('RESOLVED');
                clearInterval(intervalId);
              }
            }, 10);
          }),
        );
        clearInterval(intervalId);
        expect(result).to.equal('RESOLVED');
        expect(resolved.command).to.equal('node');
      });
    });
  });
});
