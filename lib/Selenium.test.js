const { expect } = require('chai');
const sinon = require('sinon');
const Selenium = require('./Selenium');

describe('Selenium', () => {
  let se;
  let runner;
  let run;
  let kill;

  beforeEach(() => {
    run = sinon.spy();
    kill = sinon.spy();
    runner = sinon.spy(() => ({ run, kill }));
    se = new Selenium('/some/path', { runner });
  });

  describe('when it starts', () => {
    beforeEach(() => {
      se.start();
    });

    it('calls runner', () => {
      expect(runner).to.have.been.calledOnce();
    });

    it('starts selenium', () => {
      expect(runner).to.have.been.calledWith('npx', ['selenium-standalone', 'start'], {
        shell: true,
        logger: false,
      });
      expect(run).to.have.been.calledOnce();
    });

    describe('when it is stopped', () => {
      beforeEach(() => {
        se.stop();
      });

      it('kills selenium runner', () => {
        expect(kill).to.have.been.calledOnce();
      });
    });
  });
});
