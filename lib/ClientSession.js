class ClientSession {
  constructor({ id, extensions = [], ipcClient }) {
    this.id = id;
    this.extensions = extensions;
    this.ipcClient = ipcClient;
    this.proxify = this.proxify.bind(this);
  }

  async start() {
    return this.reset();
  }

  async reset() {
    const { data } = await this.ipcClient.send('start', { id: this.id });
    return this.proxify(data);
  }

  async call(options) {
    const result = await this.ipcClient.send('call', { id: this.id, ...options });
    return this.proxify(result.data);
  }

  proxify(obj, receiver = null) {
    const { proxify } = this;
    if (obj.ctseObjectId > -1) {
      if (Array.isArray(obj)) {
        return obj.map(proxify);
      }
      if (obj.type === 'function') {
        return (...args) => this.call({
          func: obj,
          args,
          receiver: { ctseObjectId: receiver.ctseObjectId },
        });
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
