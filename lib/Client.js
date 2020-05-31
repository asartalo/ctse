const IpcClient = require('./IpcClient');
const ClientSession = require('./ClientSession');
const ClientError = require('./ClientError');

class Client {
  constructor(ipcClient, options = {}) {
    this.options = options;
    this.ipcClient = ipcClient;
  }

  get connected() {
    return this.ipcClient.connected;
  }

  connect() {
    return this.ipcClient.connect();
  }

  disconnect() {
    return this.ipcClient.disconnect();
  }

  async requestSession(options = {}) {
    if (!this.connected) {
      throw new ClientError('Client is not connected');
    }
    const { id } = await this.ipcClient.send('requestSession', { ...options });
    return new ClientSession({ id, ipcClient: this.ipcClient });
  }

  static create() {
    return new Client(IpcClient.createClient('ctse'));
  }
}

module.exports = Client;
