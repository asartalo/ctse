const { expect } = require('chai');
const { spy } = require('sinon');
const shellRunner = require('./shellRunner');

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
});
