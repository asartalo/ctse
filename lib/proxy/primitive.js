module.exports = {
  is: obj => !obj || obj.ctseObjectId === undefined,
  thus: ({ obj }) => obj,
};
