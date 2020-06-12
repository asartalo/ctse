const proxyArray = require('./array');
const proxyFunction = require('./function');
const proxyPromise = require('./promise');
const proxyObject = require('./object');
const proxyPrimitive = require('./primitive');

const proxifiers = [proxyPrimitive, proxyArray, proxyFunction, proxyPromise, proxyObject];

function proxifier(clientSession, obj, receiver) {
  return proxifiers
    .find(prox => prox.is(obj))
    .thus({
      clientSession,
      obj,
      receiver,
      proxifier,
    });
}

module.exports = proxifier;
