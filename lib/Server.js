class Server {
  constructor(ipc) {
    this.ipc = ipc;
    this.isPrepared = false;
    this._prepare();
    this.onMessageListeners = new Set();
  }

  _prepare() {
    if (this.isPrepared) {
      return;
    }
    this._serve();
    this.isPrepared = true;
  }

  _serve() {
    const { ipc } = this;
    ipc.serve(() => {
      ipc.server.on('message', (data, socket) => {
        for (const listener of this.onMessageListeners) {
          listener(data, reply => {
            ipc.server.emit(socket, 'messageReply', reply);
          });
        }
      });
    });
  }

  onMessage(listener) {
    this.onMessageListeners.add(listener);
  }

  start() {
    this.ipc.server.start();
  }
}

module.exports = Server;
