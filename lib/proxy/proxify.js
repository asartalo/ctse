const isThus = require('../isThus');
const proxyArray = require('./array');
const proxyFunction = require('./function');
const proxyPromise = require('./promise');
const proxyObject = require('./object');
const proxyPrimitive = require('./primitive');

const proxifiers = [proxyPrimitive, proxyArray, proxyFunction, proxyPromise, proxyObject];

function proxify(clientSession, obj, receiver) {
  return isThus(
    proxifiers,
    [obj],
    [
      {
        clientSession,
        obj,
        receiver,
        proxify,
      },
    ],
  );
}

module.exports = proxify;
