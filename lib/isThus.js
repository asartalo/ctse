function isThus(handlers, isArgs, thusArgs) {
  return handlers.find(handler => handler.is(...isArgs)).thus(...thusArgs);
}

module.exports = isThus;
