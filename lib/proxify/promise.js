module.exports = {
  is: obj => obj.cstor === 'Promise',
  thus: (that, obj) => {
    const { proxify, createCallback } = that;
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
          : proxify(target.props[prop], context.__ctseOriginal || context);
      },
    });
    return proxy;
  },
};
