const { expect } = require('chai');
const { spy, stub, restore } = require('sinon');
const Server = require('./Server');

const nullFn = () => {};
const randomUuid = 'e905f913-c1af-4328-b714-a7d8ffee663a';

describe('Server', () => {
  let server;
  let ipc;
  let listeners;
  let uuid;

  beforeEach(() => {
    listeners = new Map();
    ipc = {
      serve: spy(fn => fn()),
      config: {},
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
    uuid = stub();
    server = new Server(ipc, { uuid });
  });

  afterEach(() => {
    restore();
  });

  it('listens to the "start" event', () => {
    expect(listeners.get('start')).to.exist();
  });

  it('listens to the "requestSession" event', () => {
    expect(listeners.get('requestSession')).to.exist();
  });

  it('sets up with ipc.serve()', () => {
    expect(ipc.serve).to.have.been.calledOnce();
  });

  it('can only prepare once', () => {
    server._prepare();
    expect(ipc.serve).to.have.been.calledOnce();
  });

  describe('it starts', () => {
    beforeEach(() => {
      server.start();
    });

    it('starts the concrete internal ipc server', () => {
      expect(ipc.server.start).to.have.been.calledOnce();
    });
  });

  describe("when a 'requestSession' event is received", () => {
    let socket;
    beforeEach(() => {
      uuid.returns(randomUuid);
      socket = {};
      const startSessionListeners = listeners.get('requestSession');
      startSessionListeners.forEach(listener => {
        listener({}, socket);
      });
    });

    it('responds with a well formed session id', () => {
      expect(ipc.server.emit).to.have.been.calledWith(socket, 'requestSession', {
        id: randomUuid,
      });
    });
  });
});
