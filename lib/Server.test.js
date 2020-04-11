const { expect } = require('chai');
const { spy } = require('sinon');
const Server = require('./Server');

const nullFn = () => {};

describe('Server', () => {
  let server;
  let ipc;
  let listeners;

  beforeEach(() => {
    listeners = new Map();
    ipc = {
      serve: spy(fn => fn()),
      server: {
        on: spy((type, fn) => {
          if (!listeners.has(type)) {
            listeners.set(type, [fn]);
          } else {
            listeners.set(type, [...listeners.get(type), fn]);
          }
        }),
        emit: spy(),
        start: spy(),
      },
      log: nullFn,
    };
    server = new Server(ipc);
  });

  it('listens to the "message" event', () => {
    expect(listeners.get('message')).to.exist();
  });

  it('sets up with ipc.serve()', () => {
    expect(ipc.serve).to.have.been.calledOnce();
  });

  it('can only prepare once', () => {
    server._prepare();
    expect(ipc.serve).to.have.been.calledOnce();
  });

  describe('when a message listener is registered', () => {
    let messageReceived;
    let replyFn;
    beforeEach(() => {
      server.onMessage((message, reply) => {
        messageReceived = message;
        replyFn = reply;
      });
    });

    describe('and a message is message is received', () => {
      let dummySocket;
      let data;

      beforeEach(() => {
        dummySocket = { readable: true };
        data = { contents: 'Hello' };
        listeners.get('message').forEach(listener => {
          listener(data, dummySocket);
        });
      });

      it('passes the data to message listener', () => {
        expect(messageReceived).to.equal(data);
      });

      describe('if a reply is sent back', () => {
        let replySent;
        beforeEach(() => {
          replySent = { contents: 'Hi' };
          replyFn(replySent);
        });

        it('will emit it back', () => {
          expect(ipc.server.emit).to.have.been.calledOnceWith(
            dummySocket,
            'messageReply',
            replySent,
          );
        });
      });
    });
  });

  describe('it starts', () => {
    beforeEach(() => {
      server.start();
    });

    it('starts the concrete internal ipc server', () => {
      expect(ipc.server.start).to.have.been.calledOnce();
    });
  });
});
