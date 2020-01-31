const Server = require('./Server.js');

class CtSe {
  constructor(server) {
    this.server = server;
  }

  start() {
    this.server.start();
  }
}

function create() {
  const server = new Server();
  return new CtSe(server);
}

CtSe.create = create;

module.exports = CtSe;
