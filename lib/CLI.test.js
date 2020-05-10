const { expect } = require('chai');
const sinon = require('sinon');
const CLI = require('./CLI');
const CtSe = require('./CtSe');
const SeleniumBackground = require('./SeleniumBackground');
const Selenium = require('./Selenium');

describe('CLI', () => {
  describe('instance', () => {
    let cli;
    let app;
    let process;

    beforeEach(() => {
      app = {
        start: sinon.spy(),
        stop: sinon.spy(() => Promise.resolve(1)),
      };
      process = {
        listeners: new Map(),
        on: sinon.spy((event, callback) => {
          process.listeners.set(event, sinon.spy(callback));
        }),
        exit: sinon.spy(),
      };
      cli = new CLI(app, process);
    });

    describe('.start()', () => {
      beforeEach(() => {
        cli.start();
      });

      it('starts the app', () => {
        expect(app.start).to.have.been.calledOnce();
      });

      it('listens to process exits', () => {
        const eventsListenedTo = Array.from(process.listeners.keys());
        ['beforeExit', 'SIGINT', 'SIGTERM'].forEach(event => {
          expect(eventsListenedTo).to.include(event);
        });
      });
    });

    describe('when the process exits', () => {
      beforeEach(async () => {
        cli.start();
        // SIGINT is called
        process.listeners.get('SIGINT')();
      });

      it('stops the app', () => {
        expect(app.stop).to.have.been.calledOnce();
      });

      it('calls process.exit()', () => {
        expect(process.exit).to.have.been.calledOnce();
      });
    });
  });

  describe('CLI.create()', () => {
    let cli;
    const itInstantiatesCtse = () => {
      it('instantiates with a CtSe app', () => {
        expect(cli.app).to.be.an.instanceof(CtSe);
      });
    };

    describe('When run in the foreground @slow', () => {
      before(() => {
        cli = CLI.create({ foreground: false });
      });

      itInstantiatesCtse();

      it('instantiates with a background selenium runner', () => {
        expect(cli.app.runner).to.be.an.instanceof(SeleniumBackground);
      });
    });

    describe('When run in the background @slow', () => {
      before(() => {
        cli = CLI.create({ foreground: true });
      });

      itInstantiatesCtse();

      it('instantiates with a foreground selenium runner', () => {
        expect(cli.app.runner).to.be.an.instanceof(Selenium);
      });
    });
  });
});
