class Server {
  constructor(ipc) {
    this.ipc = ipc;
    this.prepare();
  }

  prepare() {
    const { ipc } = this;
    ipc.serve(() => {
      ipc.server.on('message', (data, socket) => {
        ipc.log('got a message : '.debug, data);
        ipc.server.emit(
          socket,
          'message', // this can be anything you want so long as
          // your client knows.
          `${data} world!`,
        );
      });

      ipc.server.on('socket.disconnected', (_, destroyedSocketID) => {
        ipc.log(`client ${destroyedSocketID} has disconnected!`);
      });
    });
  }

  start() {
    this.ipc.server.start();
  }
}

module.exports = Server;
