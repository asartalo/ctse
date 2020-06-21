module.exports = {
  is: () => true, // default
  thus: ({ clientSession, obj, proxify }) => new Proxy(obj, {
    has(target, prop) {
      return prop in target.props;
    },
    get(target, prop, context) {
      if (prop === '__ctseOriginal') return target;
      if (prop in target.props) {
        return proxify(clientSession, target.props[prop], context.__ctseOriginal || context);
      }
      return undefined;
    },
  }),
};
