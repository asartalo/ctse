module.exports = {
  is: Array.isArray,
  thus: ({ clientSession, obj, proxifier }) => obj.map(item => proxifier(clientSession, item)),
};
