const { expect } = require('chai');
const sinon = require('sinon');
const SeleniumBackground = require('./SeleniumBackground');

describe('SeleniumBackground', () => {
  let se;
  let runner;
  let run;
  let composeFile;
  let runnerCalls;

  beforeEach(() => {
    composeFile = '/path/to/docker-compose-file.yml';
    run = sinon.spy(() => Promise.resolve({ code: 0 }));
    runnerCalls = [];
    runner = sinon.spy((...args) => {
      runnerCalls.push(args);
      return { run };
    });
    se = new SeleniumBackground('a/path', { runner, composeFile });
  });

  describe('when it starts', () => {
    beforeEach(() => se.start());

    it('calls runner', () => {
      expect(runner).to.have.been.calledTwice();
    });

    it('starts docker-compose', () => {
      expect(runnerCalls[0]).to.eql([
        'docker-compose',
        ['-p', 'ctse', '-f', composeFile, 'up', '-d'],
        { logger: false, shell: true },
      ]);
      expect(runnerCalls[1]).to.eql(['docker', ['logs', '-f', 'ctse_se_hub_1'], { logger: false }]);
    });
  });

  describe('when it is stopped', () => {
    beforeEach(() => se.stop());

    it('stops the docker hub', () => {
      expect(runnerCalls[0]).to.eql([
        'docker-compose',
        ['-p', 'ctse', '-f', composeFile, 'down'],
        { logger: false, shell: true },
      ]);
    });
  });
});
