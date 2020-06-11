const noop = () => {};

class ClientSession {
  constructor({ id, extensions = [], ipcClient }) {
    this.id = id;
    this.extensions = extensions;
    this.ipcClient = ipcClient;
    this.proxify = this.proxify.bind(this);
    this.promiseRegistry = new Map();
    this.resolveSent = new Set();
    this.callId = 0;
    this.addPromiseCallbacks = this.addPromiseCallbacks.bind(this);
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
    const { proxify } = this;
    if (obj && obj.ctseObjectId > -1) {
      if (Array.isArray(obj)) {
        return obj.map(proxify);
      }
      if (obj.type === 'function') {
        return (...args) => this.call({
          func: obj,
          args: args.map(arg => {
            if (arg.__ctseCallId > -1) {
              return { __ctseCallId: arg.__ctseCallId };
            }
            return arg.__ctseOriginal ? arg.__ctseOriginal : arg;
          }),
          receiver: { ctseObjectId: receiver.ctseObjectId },
        });
      }
      if (obj.cstor === 'Promise') {
        const { addPromiseCallbacks } = this;
        const proxy = new Proxy(obj, {
          get(target, prop, context) {
            switch (prop) {
              case '__ctseOriginal':
                return target;

              case 'constructor':
                return Promise;

              case 'then':
              case 'catch':
              case 'finally':
                return fn => {
                  addPromiseCallbacks(target, prop, fn);
                  return proxy;
                };
              default:
                if (target.props[prop] === undefined) return undefined;
            }
            return proxify(target.props[prop], context.__ctseOriginal || context);
          },
        });
        return proxy;
      }

      return new Proxy(obj, {
        get(target, prop, context) {
          if (prop === '__ctseOriginal') return target;
          if (target.props[prop] === undefined) return undefined;
          return proxify(target.props[prop], context.__ctseOriginal || context);
        },
      });
    }
    return obj;
  }
}

module.exports = ClientSession;
