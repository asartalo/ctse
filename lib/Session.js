const Base = require('./objects/Base');
const Store = require('./objects/Store');

class Session {
  constructor(id) {
    this.id = id;
    this.callReturns = new Map();
    this.resolve = this.resolve.bind(this);
    this.selfOrObjectified = this.selfOrObjectified.bind(this);
    this.store = new Store();

    // TODO: Remove this;
    this._loopCheck = 0;
  }

  reset() {
    this.store.clear();
    this.callReturns.clear();
  }

  async start() {
    if (this.currentBaseId > -1) {
      const base = this.store.getObject(this.currentBaseId);
      await base.reset();
    }
    return this.createBase();
  }

  createBase() {
    const base = this.store.objectify(new Base());
    this.currentBaseId = base.ctseObjectId;
    return base;
  }

  selfOrObjectified(item) {
    if (!item) {
      return item;
    }
    if (item.__ctseCallId) {
      return this.callReturns.get(item.__ctseCallId);
    }
    if (!(item.ctseObjectId > -1)) {
      return item;
    }
    if (!this.store.hasObject(item.ctseObjectId)) {
      throw Error(`Item with ctseObjectId: ${item.ctseObjectId} does not exist`);
    }
    const obj = this.store.getObject(item.ctseObjectId);
    return obj;
  }

  async resolve({ object }) {
    const promise = this.store.getObject(object.ctseObjectId);
    try {
      const value = this.store.objectify(await promise);
      return { resolved: true, value };
    } catch (error) {
      return { resolved: false, error: this.store.objectifyError(error) };
    }
  }

  async callFunc({
    func, args, receiver, ctseCallId,
  }) {
    if (this._loopCheck > 10000) throw Error('too much recursion');
    this._loopCheck += 1;
    const fn = this.store.getObject(func.ctseObjectId);
    const rec = this.selfOrObjectified(receiver);
    const theArgs = args.map(this.selfOrObjectified);
    const result = this.store.objectify(fn.apply(rec, theArgs));
    if (ctseCallId && result.ctseObjectId > -1) {
      this.callReturns.set(ctseCallId, this.store.getObject(result.ctseObjectId));
    }
    return result;
  }
}

module.exports = Session;
