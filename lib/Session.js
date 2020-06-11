const Base = require('./objects/Base');

const commonObjectFn = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf({})));
const notUnder = key => key[0] !== '_';

function getStaticMethods(obj) {
  const props = Object.getOwnPropertyNames(obj);

  return props.filter(prop => prop.constructor === Function);
}

function getPrototypeMethods(obj) {
  const properties = new Set();
  let currentObj = obj;
  do {
    Object.getOwnPropertyNames(currentObj).forEach(item => properties.add(item));
    currentObj = Object.getPrototypeOf(currentObj);
  } while (currentObj);
  const props = [...properties.values()].filter(prop => prop !== 'constructor');

  if (obj.constructor.name === 'Object') {
    return props.filter(prop => !commonObjectFn.has(prop));
  }
  return props;
}

function getAllProps(obj) {
  if (typeof obj === 'function') {
    return [];
  }
  const keys = new Set(
    Object.getOwnPropertyNames(obj)
      .concat(getPrototypeMethods(obj))
      .concat(getStaticMethods(obj)),
  );

  const props = Array.from(keys.values()).filter(notUnder);
  return props;
}

class Session {
  constructor(id) {
    this.id = id;
    this.objectIds = 0;
    this.objects = new Map();
    this.callReturns = new Map();
    this.objectify = this.objectify.bind(this);
    this.resolve = this.resolve.bind(this);
    this.selfOrObjectified = this.selfOrObjectified.bind(this);
    this.hasObject = this.hasObject.bind(this);

    // TODO: Remove this;
    this._loopCheck = 0;
  }

  newObjectId() {
    this.objectIds += 1;
    return this.objectIds;
  }

  addObject(object) {
    const objectId = this.newObjectId();
    this.objects.set(objectId, object);
    return objectId;
  }

  getObject(objectId) {
    return this.objects.get(objectId);
  }

  hasObject(objectId) {
    if (objectId > -1) {
      return this.objects.has(objectId);
    }
    return undefined;
  }

  objectCount() {
    return this.objects.size;
  }

  reset() {
    this.objects.clear();
    this.callReturns.clear();
  }

  async start() {
    if (this.currentBaseId > -1) {
      const base = this.getObject(this.currentBaseId);
      await base.reset();
    }
    return this.createBase();
  }

  createBase() {
    const base = this.objectify(new Base());
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
    if (!this.hasObject(item.ctseObjectId)) {
      throw Error(`Item with ctseObjectId: ${item.ctseObjectId} does not exist`);
    }
    const obj = this.getObject(item.ctseObjectId);
    return obj;
  }

  async resolve({ object }) {
    const promise = this.getObject(object.ctseObjectId);
    try {
      const value = this.objectify(await promise);
      return { resolved: true, value };
    } catch (error) {
      return { resolved: false, error: this.objectifyError(error) };
    }
  }

  async callFunc({
    func, args, receiver, ctseCallId,
  }) {
    if (this._loopCheck > 300) throw Error('too much recursion');
    this._loopCheck += 1;
    const fn = this.getObject(func.ctseObjectId);
    const rec = this.selfOrObjectified(receiver);
    const theArgs = args.map(this.selfOrObjectified);
    return this.objectify(fn.apply(rec, theArgs), ctseCallId);
  }

  objectify(object, ctseCallId = false) {
    const tracker = new Map();
    return this._objectify(object, tracker, ctseCallId);
  }

  objectifyError(error) {
    return { ...this.objectify(error), type: 'error' };
  }

  _objectify(object, tracker, ctseCallId) {
    if (!object) {
      return object;
    }

    if (Array.isArray(object)) {
      return object.map(item => this._objectify(item, tracker));
    }

    const type = typeof object;

    if (!(type === 'object' || type === 'function')) {
      return object;
    }

    if (tracker.has(object)) {
      return tracker.get(object);
    }

    const ctseObjectId = this.addObject(object);
    if (ctseCallId) {
      this.callReturns.set(ctseCallId, object);
    }

    const representation = {
      props: getAllProps(object).reduce(
        (obj, key) => ({ ...obj, [key]: this._objectify(object[key], tracker) }),
        {},
      ),
      ctseObjectId,
      type,
      cstor: object.constructor.name,
    };
    if (type === 'function') {
      representation.funcName = object.name;
    }

    tracker.set(object, representation);
    return representation;
  }
}

module.exports = Session;
