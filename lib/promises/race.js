function race(...promises) {
  const nullFn = () => {};
  return new Promise(originalResolve => {
    let resolve = originalResolve;
    promises.forEach(promise => {
      promise.then(result => {
        resolve(result);
        resolve = nullFn;
      });
    });
  });
}

module.exports = race;
