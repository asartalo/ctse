const { Builder, By, until } = require('selenium-webdriver');
const chromeSn = require('selenium-webdriver/chrome');
const { readFileSync } = require('fs');

const encodeExt = file => {
  const stream = readFileSync(file);
  return Buffer.from(stream).toString('base64');
};

async function chrome({ selenium, baseUrl, extensions = [] }) {
  const options = new chromeSn.Options();

  extensions.forEach(extension => {
    options.addExtensions(encodeExt(extension));
  });

  const driver = await new Builder()
    .forBrowser('chrome')
    .usingServer(selenium)
    .setChromeOptions(options)
    .build();

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

module.exports = chrome;
