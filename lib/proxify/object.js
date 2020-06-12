module.exports = {
  is: () => true, // default
  thus: ({ clientSession, obj, proxifier }) => new Proxy(obj, {
    get(target, prop, context) {
      if (prop === '__ctseOriginal') return target;
      if (target.props[prop] === undefined) return undefined;
      return proxifier(clientSession, target.props[prop], context.__ctseOriginal || context);
    },
  }),
};
