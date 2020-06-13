const isThus = require('../isThus');

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

const thru = object => object;
const falsy = object => !object;
const any = () => true;

class Store {
  constructor() {
    this.objectIds = 0;
    this.objects = new Map();
    this.objectify = this.objectify.bind(this);
    this._objectify = this._objectify.bind(this);
    this.hasObject = this.hasObject.bind(this);
    this.addObject = this.addObject.bind(this);
    this.prepareObjectifiers();
  }

  prepareObjectifiers() {
    const { _objectify } = this;
    this.objectifiers = [
      {
        is: falsy,
        thus: thru,
      },
      {
        is: Array.isArray,
        thus: (object, tracker) => object.map(item => _objectify(item, tracker)),
      },
      {
        is: object => {
          const type = typeof object;
          return !(type === 'object' || type === 'function');
        },
        thus: thru,
      },
      {
        is: (object, tracker) => tracker.has(object),
        thus: (object, tracker) => tracker.get(object),
      },
      this.objectObjectifier(),
    ];
  }

  objectObjectifier() {
    const { _objectify, addObject } = this;
    return {
      is: any,
      thus: (object, tracker) => {
        const ctseObjectId = addObject(object);
        const type = typeof object;

        const representation = {
          props: getAllProps(object).reduce(
            (obj, key) => ({ ...obj, [key]: _objectify(object[key], tracker) }),
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
      },
    };
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

  clear() {
    this.objects.clear();
  }

  objectify(object) {
    const tracker = new Map();
    const objectified = this._objectify(object, tracker);
    tracker.clear();
    return objectified;
  }

  objectifyError(error) {
    return { ...this.objectify(error), type: 'error' };
  }

  _objectify(object, tracker) {
    return isThus(this.objectifiers, [object, tracker], [object, tracker]);
  }
}

module.exports = Store;
