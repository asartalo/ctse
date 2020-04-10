function createLogger(...observers) {
  const { stdout } = process;
  return data => {
    stdout.write(data);
    const toLog = `${data}`;
    observers.forEach(observer => observer(toLog));
  };
}

function createSeleniumChecker(foreground = false) {
  let ready = false;
  const readyMessage = 'CtSe: Selenium Server Ready';

  if (foreground) {
    return str => {
      if (!ready) {
        if (str.match(/Selenium started/)) {
          ready = true;
          console.log(readyMessage);
        }
      }
    };
  }

  const nBrowsers = 2;
  let registered = 0;

  return str => {
    if (!ready) {
      registered += [...str.matchAll(/Registered a node/g)].length;
      if (registered >= nBrowsers) {
        ready = true;
        console.log(readyMessage);
      }
    }
  };
}

module.exports = {
  createLogger,
  createSeleniumChecker,
};
