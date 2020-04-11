function wait(time = 3000) {
  return new Promise(resolve => {
    setTimeout(() => resolve(time), time);
  });
}

module.exports = wait;
