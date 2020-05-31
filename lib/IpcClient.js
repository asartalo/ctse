const { IPC } = require('node-ipc');

class IpcClient {
  constructor(ipc, serverName, options = {}) {
    const { logger } = { logger: false, ipcConfig: false, ...options };
    this.ipc = ipc;
    if (logger) {
      this.ipc.config.logger = logger;
    } else {
      this.ipc.config.silent = true;
    }
    this.messageTimeout = options.messageTimeout || 30000;
    this.serverName = serverName;
    this.connected = false;
    this.off = this.off.bind(this);
    this.on = this.on.bind(this);
    this.messageId = 0;
    this.listeners = new Map();
    this.waiting = new Map();
  }

  getWaitId() {
    this.messageId += 1;
    return this.messageId;
  }

  on(event, callback) {
    return this.ipc.of[this.serverName].on(event, callback);
  }

  off(event, callback) {
    return this.ipc.of[this.serverName].off(event, callback);
  }

  emit(event, data) {
    return this.ipc.of[this.serverName].emit(event, data);
  }

  send(event, data) {
    if (!this.listeners.has(event)) {
      const listener = response => {
        const { messageId } = response;
        const callback = this.waiting.get(messageId);
        if (callback) {
          const toReturn = { ...response };
          delete toReturn.messageId;
          callback(toReturn);
          this.waiting.delete(messageId);
        }
      };
      this.listeners.set(event, listener);
      this.on(event, listener);
    }

    return new Promise((resolve, reject) => {
      const messageId = this.getWaitId();
      this.emit(event, { messageId, ...data });
      // TODO: This will leak unless.
      // Clear this after parent object has been removed
      const timeoutId = setTimeout(() => {
        // TODO: Use a dedicated Error class
        reject(Error(`Timeout: ${event}, messageId: ${messageId}`));
      }, 30000);
      this.waiting.set(messageId, response => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }

  connect() {
    if (this.connected) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.ipc.connectTo(this.serverName, () => {
        this.on('connect', () => {
          this.connected = true;
          resolve();
        });

        this.on('disconnect', () => {
          this.connected = false;
          if (this.disconnectResolver) {
            this.disconnectResolver();
          }
        });
      });
    });
  }

  disconnect() {
    if (this.connected) {
      return new Promise(resolve => {
        this.disconnectResolver = data => {
          resolve(data);
          this.disconnectResolver = null;
        };
        this.ipc.disconnect(this.serverName);
      });
    }
    return Promise.resolve();
  }

  static createClient(serverName) {
    const ipc = new IPC();
    ipc.config.retry = 1500;
    return new IpcClient(ipc, serverName);
  }
}

module.exports = IpcClient;
