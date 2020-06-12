module.exports = {
  is: () => true, // default
  thus: ({ clientSession, obj, proxify }) => new Proxy(obj, {
    get(target, prop, context) {
      if (prop === '__ctseOriginal') return target;
      if (target.props[prop] === undefined) return undefined;
      return proxify(clientSession, target.props[prop], context.__ctseOriginal || context);
    },
  }),
};
