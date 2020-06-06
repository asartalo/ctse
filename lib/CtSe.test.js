const { expect } = require('chai');
const sinon = require('sinon');
const CtSe = require('./CtSe');

describe('CtSe', () => {
  let ctse;
  let server;
  let runner;

  beforeEach(() => {
    server = {
      start: sinon.spy(),
      stop: sinon.spy(),
    };
    runner = {
      start: sinon.spy(),
      stop: sinon.spy(() => Promise.resolve(1)),
    };
    ctse = new CtSe(server, runner);
  });

  describe('#start()', () => {
    beforeEach(() => {
      ctse.start();
    });

    it('starts the runner', () => {
      expect(runner.start).to.have.been.calledOnce();
    });

    it('starts the server', () => {
      expect(server.start).to.have.been.calledOnce();
    });
  });

  describe('when the process exits', () => {
    let stopReturn;

    beforeEach(async () => {
      ctse.start();
      stopReturn = await ctse.stop();
    });

    it('stops the runner', () => {
      expect(runner.stop).to.have.been.calledOnce();
    });

    it('returns what runner has resolved', () => {
      expect(stopReturn).to.equal(1);
    });
  });
});
