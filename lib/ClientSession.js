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
    this.addPromiseCallbacks = this.addPromiseCallbacks.bind(this);
    this.createCallback = this.createCallback.bind(this);
  }

  async start() {
    return this.reset();
  }

  async reset() {
    const { data } = await this.ipcClient.send('start', { id: this.id });
    this.promiseRegistry.clear();
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

  addPromiseCallbacks(object, prop, callback) {
    const objId = object.ctseObjectId;
    const callbacks = this.promiseRegistry.get(object.ctseObjectId);
    this.promiseRegistry.set(objId, {
      ...callbacks,
      [prop]: callback,
    });
    if (!this.resolveSent.has(objId)) {
      this.resolveSent.add(objId);
      this.sendResolve(object);
    }
  }

  async sendResolve(object) {
    const response = await this.ipcClient.send('resolve', { id: this.id, object });
    const result = response.data;
    const cbs = this.promiseRegistry.get(object.ctseObjectId);
    if (result.resolved) {
      (cbs.then || noop)(result.value);
    } else {
      // TODO: Better error translation and
      // probably throw with UnhandledPromiseRejection error or something
      // when no catch is available
      (cbs.catch || noop)(new Error(result.error.message));
    }
    // finally
    (cbs.finally || noop)();
  }

  createCallback(prop) {
    return (target, proxy) => fn => {
      this.addPromiseCallbacks(target, prop, fn);
      return proxy;
    };
  }
}

module.exports = ClientSession;
