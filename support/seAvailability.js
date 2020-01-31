const { Builder, By } = require('selenium-webdriver');
const chromeSn = require('selenium-webdriver/chrome');

const Availability = require('./Availability.js');
const createServer = require('./createServer.js');
const shellRunner = require('../lib/shellRunner.js');

const server = createServer(4000);

const VERBOSE = !!process.env.CTSE_E2E_VERBOSE;
function vblog(...args) {
  if (VERBOSE) {
    console.log.apply(null, args); // eslint-disable-line no-console
  }
}

async function chrome(host, url) {
  const driver = await new Builder()
    .forBrowser('chrome')
    .usingServer(`http://${host}/wd/hub`)
    .setChromeOptions(new chromeSn.Options())
    .build();

  await driver.get(url);

  return {
    url,
    driver,
    find: selector => driver.findElement(By.css(selector)),
    stop: () => driver.quit(),
  };
}

function dockerCheck(testTimeout) {
  const timeout = 0.25 * testTimeout;
  vblog('dockerCheck...');
  return new Promise(resolve => {
    let logs = '';
    let timeoutId;
    let running = false;
    let checkTimes = 0;

    const cmd = shellRunner(
      'docker-compose',
      ['-f', './docker-compose-selenium.yml', 'top'],
      {
        logger: data => {
          const str = `${data}`;
          vblog('dockerCheck checking...', str);
          logs += str;
          if (str.match(/se_hub/)) {
            vblog('dockerCheck success...');
            cmd.kill();
            clearTimeout(timeoutId);
            resolve(false);
          }
        },
      },
    );

    const maxCheckTimes = Math.floor(timeout / 500);

    const intervalId = setInterval(() => {
      checkTimes += 1;
      if (checkTimes > maxCheckTimes) {
        clearInterval(intervalId);
        cmd.kill();
        return;
      }
      if (!running) {
        vblog(`dockerCheck try ${checkTimes}...`);
        running = true;
        cmd.run().then(result => {
          vblog(result);
          running = false;
          if (logs !== '') {
            clearInterval(intervalId);
          }
          logs = '';
        });
      }
    }, 500);

    let result;
    timeoutId = setTimeout(async () => {
      clearInterval(intervalId);
      resolve(`Timed out checking Selenium through docker compose${result ? (result.stderr || result.stdout) : ''} ${logs}`);
    }, timeout);
  });
}

function seReadinessCheck(logger, testTimeout) {
  const timeout = 0.625 * testTimeout;
  const t0 = Date.now();
  vblog('seReadinessCheck...');
  return new Promise(resolve => {
    let log = '';
    let timeoutId;
    let done = false;

    logger.observe(str => {
      if (done) {
        return;
      }

      log += str;
      const timePassed = (Date.now() - t0) / 1000;
      vblog(`${timePassed}s seReadinessCheck checking...`, str);
      if (str.match(/CtSe: Selenium Server Ready/)) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        done = true;
        vblog(log);
        resolve(false);
      }
    });

    timeoutId = setTimeout(() => {
      resolve(`Timed out checking selenium server is ready ${log}`);
    }, timeout);
  });
}

module.exports = async function seAvailability(host, options = {}) {
  vblog('seAvailability start');
  const { foreground, logger, timeout } = { foreground: false, ...options };
  let availability = new Availability('selenium');

  if (!foreground) {
    const dockerCheckMessage = await dockerCheck(timeout);
    if (dockerCheckMessage) {
      return availability.set({ message: dockerCheckMessage });
    }
  }
  const readinessMessage = await seReadinessCheck(logger, timeout);
  if (readinessMessage) {
    return availability.set({ message: readinessMessage });
  }

  let browser;
  async function stepWatch(failMessage, fn) {
    try {
      await fn();
    } catch (e) {
      server.stop();
      if (browser) {
        browser.stop();
      }
      return `${failMessage} ${e.message} ${e.stack}`;
    }
    return false;
  }

  let message = await stepWatch('Server start fail', async () => {
    vblog('Starting test server');
    await server.start();
  });
  if (message) {
    return availability.set({ message });
  }

  message = await stepWatch('Selenium client startup fail', async () => {
    vblog({ host });
    browser = await chrome(host, server.url);
  });
  if (message) {
    return availability.set({ message });
  }

  let paragraph;
  let text;
  message = await stepWatch('Test page reading fail', async () => {
    paragraph = await browser.find('p');
    text = await paragraph.getText();
  });
  if (message) {
    return availability.set({ message });
  }

  if (text !== 'This page is just for testing') {
    availability = availability.set({
      message: `Unable check test page. Found "${text}"`,
    });
  } else {
    availability = availability.set({
      available: true,
      noMessage: 'Selenium started successfully',
    });
  }

  server.stop();
  await browser.stop();
  return availability;
};
