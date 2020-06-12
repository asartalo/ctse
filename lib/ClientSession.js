const proxyArray = require('./proxify/array');
const proxyFunction = require('./proxify/function');
const proxyPromise = require('./proxify/promise');

const noop = () => {};

class ClientSession {
  constructor({ id, extensions = [], ipcClient }) {
    this.id = id;
    this.extensions = extensions;
    this.ipcClient = ipcClient;
    this.promiseRegistry = new Map();
    this.resolveSent = new Set();
    this.callId = 0;
    this.proxify = this.proxify.bind(this);
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
    return this.proxify(data);
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
      .then(result => this.proxify(result.data));
    callPromise.__ctseCallId = ctseCallId;
    return callPromise;
  }

  async addPromiseCallbacks(object, prop, callback) {
    const objId = object.ctseObjectId;
    const callbacks = this.promiseRegistry.get(object.ctseObjectId);
    this.promiseRegistry.set(objId, {
      ...callbacks,
      [prop]: callback,
    });
    if (!this.resolveSent.has(objId)) {
      this.resolveSent.add(objId);
      const response = await this.ipcClient.send('resolve', { id: this.id, object });
      const result = response.data;
      const cbs = this.promiseRegistry.get(objId);
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
  }

  proxify(obj, receiver = null) {
    let proxied = obj;
    if (obj && obj.ctseObjectId > -1) {
      if (proxyArray.is(obj)) {
        proxied = proxyArray.thus(this, obj);
      } else if (proxyFunction.is(obj)) {
        proxied = proxyFunction.thus(this, obj, receiver);
      } else if (proxyPromise.is(obj)) {
        proxied = proxyPromise.thus(this, obj, receiver);
      } else {
        proxied = this.proxifyObject(obj);
      }
    }
    return proxied;
  }

  proxifyObject(obj) {
    const { proxify } = this;
    return new Proxy(obj, {
      get(target, prop, context) {
        if (prop === '__ctseOriginal') return target;
        if (target.props[prop] === undefined) return undefined;
        return proxify(target.props[prop], context.__ctseOriginal || context);
      },
    });
  }

  createCallback(prop) {
    return (target, proxy) => fn => {
      this.addPromiseCallbacks(target, prop, fn);
      return proxy;
    };
  }
}

module.exports = ClientSession;
