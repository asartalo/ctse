module.exports = {
  is: Array.isArray,
  thus: (context, obj) => obj.map(context.proxify),
};
