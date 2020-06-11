const { v4 } = require('uuid');
const Session = require('./Session');

class Server {
  constructor(ipc, options = {}) {
    const { logger, uuid } = { logger: false, uuid: false, ...options };
    this.ipc = ipc;
    if (logger) {
      this.ipc.config.logger = logger;
    } else {
      this.ipc.config.silent = true;
      // this.ipc.config.logger = console.log;
    }

    this.uuid = uuid || v4;
    this.isPrepared = false;
    this._prepare();
    this.onMessageListeners = new Set();
    this.sessionStore = new Map();
  }

  _prepare() {
    if (this.isPrepared) {
      return;
    }
    this._serve();
    this.isPrepared = true;
  }

  on(event, callback) {
    this.ipc.server.on(event, (...args) => {
      callback(...args);
    });
  }

  emit(socket, event, data) {
    this.ipc.server.emit(socket, event, data);
  }

  _serve() {
    this.ipcServed = false;
    this.ipc.serve(() => {
      if (this.ipcServed) return;

      this.on('requestSession', (data, socket) => {
        const id = (data && data.id) || this.uuid();
        if (!this.sessionStore.has(id)) {
          this.sessionStore.set(id, new Session(id));
        }
        this.emit(socket, 'requestSession', { id, ...data });
      });

      this.on('start', async (request, socket) => {
        const { id, messageId } = request;
        const session = this.sessionStore.get(id);
        const response = { messageId, success: true };
        if (!session) {
          response.success = false;
          response.message = `Session does not exist: ${id}`;
        } else {
          response.data = await session.start(request);
        }
        this.emit(socket, 'start', response);
      });

      this.on('call', async (request, socket) => {
        const { id, messageId } = request;
        const session = this.sessionStore.get(id);
        const response = { messageId, success: true };
        if (!session) {
          response.success = false;
          response.message = `Session does not exist: ${id}`;
        } else {
          // TODO: How do we handle errors and throws?
          response.data = await session.callFunc(request);
        }
        this.emit(socket, 'call', response);
      });

      this.on('resolve', async (request, socket) => {
        const { id, messageId } = request;
        const session = this.sessionStore.get(id);
        const response = { messageId, success: true };
        if (!session) {
          response.success = false;
          response.message = `Session does not exist: ${id}`;
        } else {
          // TODO: How do we handle errors and throws?
          response.data = await session.resolve(request);
        }
        this.emit(socket, 'resolve', response);
      });

      this.ipcServed = true;
    });
  }

  onMessage(listener) {
    this.onMessageListeners.add(listener);
  }

  start() {
    this.ipc.server.start();
  }

  stop() {
    this.ipc.server.stop();
  }
}

module.exports = Server;
