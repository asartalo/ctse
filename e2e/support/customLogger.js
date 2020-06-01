let logs = [];
function logger(...items) {
  items.forEach(item => logs.push(item));
}

function outputLogs() {
  const current = [...logs];
  logs = [];
  return current;
}

module.exports = { logger, outputLogs };
