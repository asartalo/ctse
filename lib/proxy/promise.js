module.exports = {
  is: obj => obj.cstor === 'Promise',
  thus: ({ clientSession, obj, proxifier }) => {
    const { createCallback } = clientSession;
    const knownProps = {
      __ctseOriginal: () => obj,
      constructor: () => Promise,
      then: createCallback('then'),
      catch: createCallback('catch'),
      finally: createCallback('finally'),
    };
    const proxy = new Proxy(obj, {
      get(target, prop, context) {
        const known = knownProps[prop];
        return known
          ? known(target, proxy)
          : proxifier(clientSession, target.props[prop], context.__ctseOriginal || context);
      },
    });
    return proxy;
  },
};
