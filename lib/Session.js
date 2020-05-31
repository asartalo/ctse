const Base = require('./objects/Base');

const commonObjectFn = new Set(Object.getOwnPropertyNames(Object.getPrototypeOf({})));
const notUnder = key => key[0] !== '_';

function getStaticMethods(obj) {
  const props = Object.getOwnPropertyNames(obj);

  return props.filter(prop => prop.constructor === Function);
}

function getPrototypeMethods(obj) {
  const props = Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(
    prop => prop !== 'constructor',
  );
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
  return Array.from(keys.values()).filter(notUnder);
}

class Session {
  constructor(id) {
    this.id = id;
    this.objectIds = 0;
    this.objects = new Map();
    this.objectify = this.objectify.bind(this);
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
  }

  async start() {
    return this.objectify(new Base());
  }

  async callFunc({ func, args, receiver }) {
    const fn = this.getObject(func.ctseObjectId);
    const rec = this.hasObject(receiver.ctseObjectId)
      ? this.getObject(receiver.ctseObjectId)
      : receiver;
    return fn.apply(rec, args);
  }

  objectify(object) {
    const tracker = new Map();
    return this._objectify(object, tracker);
  }

  _objectify(object, tracker) {
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
    const representation = {
      props: getAllProps(object).reduce(
        (obj, key) => ({ ...obj, [key]: this._objectify(object[key], tracker) }),
        {},
      ),
      ctseObjectId,
      type,
      cstor: object.constructor.name,
    };
    tracker.set(object, representation);
    return representation;
  }
}

module.exports = Session;
