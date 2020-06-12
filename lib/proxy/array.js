module.exports = {
  is: Array.isArray,
  thus: ({ clientSession, obj, proxify }) => obj.map(item => proxify(clientSession, item)),
};
