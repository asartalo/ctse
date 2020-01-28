const Server = require('./Server.js');

class Ctse {
  constructor(server) {
    this.server = server;
  }

  start() {
    this.server.start();
  }
}

function create() {
  const server = new Server();
  return new Ctse(server);
}

Ctse.create = create;

module.exports = Ctse;
