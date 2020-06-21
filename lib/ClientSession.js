const proxify = require('./proxy/proxify');

const noop = () => {};

class ClientSession {
  constructor({ id, extensions = [], ipcClient }) {
    this.id = id;
    this.extensions = extensions;
    this.ipcClient = ipcClient;
    this.promiseRegistry = new Map();
    this.resolveSent = new Set();
    this.callId = 0;
  }

  async start() {
    return this.reset();
  }

  async reset() {
    const { data } = await this.ipcClient.send('start', { id: this.id });
    this.promiseRegistry.clear();
    this.resolveSent.clear();
    this.callId = 0;
    return proxify(this, data);
  }

  getCallId() {
    this.callId += 1;
    return this.callId;
  }

  call({ func, args, receiver }) {
    const ctseCallId = this.getCallId();
    const callPromise = this.ipcClient
      .send('call', {
        id: this.id,
        func,
        args,
        receiver,
        ctseCallId,
      })
      .then(result => proxify(this, result.data));
    callPromise.__ctseCallId = ctseCallId;
    return callPromise;
  }

  registerResolver(obj, resolver) {
    this.promiseRegistry.set(obj.ctseObjectId, resolver);
  }

  callResolve(object) {
    const objId = object.ctseObjectId;
    if (!this.resolveSent.has(objId)) {
      this.resolveSent.add(objId);
      this.sendResolve(object);
    }
  }

  sendResolve(object) {
    this.ipcClient.send('resolve', { id: this.id, object }).then(response => {
      const result = response.data;
      const { resolve, reject } = this.promiseRegistry.get(object.ctseObjectId);
      if (result.resolved) {
        if (resolve) {
          resolve(proxify(this, result.value));
        }
      } else {
        // TODO: Better error translation and
        // probably throw with UnhandledPromiseRejection error or something
        // when no catch is available
        (reject || noop)(new Error(result.error.props.message));
      }
    });
  }
}

module.exports = ClientSession;
