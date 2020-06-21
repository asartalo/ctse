const promiseFns = new Set(['then', 'catch', 'finally']);

module.exports = {
  is: obj => {
    const { cstor, props } = obj;
    if (cstor === 'Promise') {
      return true;
    }
    return (
      props.then && props.then.type === 'function' && props.catch && props.catch.type === 'function'
    );
  },
  thus: ({ clientSession, obj }) => {
    if (obj.ctseObjectId === 239) {
      return Promise.resolve(1);
    }
    const promise = new Promise((resolve, reject) => {
      clientSession.registerResolver(obj, { resolve, reject });
    });
    return new Proxy(promise, {
      get(target, prop) {
        if (prop === '__ctseOriginal') {
          return obj;
        }
        if (promiseFns.has(prop)) {
          clientSession.callResolve(obj);
          return target[prop].bind(target);
        }
        return target[prop];
      },
    });
  },
};
