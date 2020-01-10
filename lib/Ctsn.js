const Server = require('./Server.js');

class Ctsn {
  constructor(server) {
    this.server = server;
  }

  start() {
    this.server.start();
  }
}

function create() {
  const server = new Server();
  return new Ctsn(server);
}

Ctsn.create = create;

module.exports = Ctsn;
