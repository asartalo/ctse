const { Builder, By, until } = require('selenium-webdriver');
const firefoxSn = require('selenium-webdriver/firefox');
const { Command } = require('selenium-webdriver/lib/command');

async function installWebExt(driver, extension) {
  const session = await driver.session_; // eslint-disable-line no-underscore-dangle
  // console.log({ ffSession: session.toJSON() });
  const cmd = new Command('moz-install-web-ext')
    .setParameter('path', extension)
    .setParameter('sessionId', session.getId())
    .setParameter('temporary', true);

  const executor = driver.getExecutor();
  executor.defineCommand(cmd.getName(), 'POST', '/session/:sessionId/moz/addon/install');
  return executor.execute(cmd);
}

const options = new firefoxSn.Options().setPreference('extensions.firebug.showChromeErrors', true);

async function firefox({ selenium, baseUrl, extensions = [] }) {
  const driver = await new Builder()
    .forBrowser('firefox')
    .usingServer(selenium)
    .setFirefoxOptions(options)
    .build();

  for (const extension of extensions) {
    await installWebExt(driver, extension); // eslint-disable-line no-await-in-loop
  }
  await driver.get(baseUrl);

  return {
    baseUrl,
    driver,
    find: selector => driver.findElement(By.css(selector)),
    reset: () => driver.get(baseUrl),
    stop: () => driver.quit(),
    waitUntil: (what, timeout = 1000) => {
      const [thing, ...condition] = Object.entries(what)[0];
      return driver.wait(until[thing](...condition), timeout);
    },
  };
}

module.exports = firefox;
